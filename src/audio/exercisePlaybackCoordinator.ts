import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
import { musoAudioEngine } from "./createWebAudioEngine";
import {
  type AudioEngine,
  type AudioPresetId,
  type PlaybackGroupHandle,
} from "./types";
import { type ExerciseCountInBeats } from "@/types/session";

const START_LOOKAHEAD_SECONDS = 0.08;
const NOTE_GATE_RATIO = 0.9;

export interface ExercisePlaybackEvent {
  durationBeats: number;
  midi: number;
  offsetBeats: number;
  stepIndex: number;
}

export interface ExercisePlaybackRequest {
  countInBeats: ExerciseCountInBeats;
  events: readonly ExercisePlaybackEvent[];
  id: string;
  metronomeEnabled: boolean;
  presetId: AudioPresetId;
  tempoBpm: number;
}

export interface ExercisePlaybackSnapshot {
  activeId?: string;
  cycleDuration?: number;
  events: readonly ExercisePlaybackEvent[];
  originTime?: number;
  pendingId?: string;
  playing: boolean;
  secondsPerBeat?: number;
}

interface ActiveExercisePlayback {
  group: PlaybackGroupHandle;
  metronomeScheduler?: LookaheadScheduler;
  noteScheduler: LookaheadScheduler;
  snapshot: ExercisePlaybackSnapshot;
}

export type ExercisePlaybackAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "scheduleMetronomeClick"
  | "scheduleNote"
  | "subscribeToReset"
  | "subscribeToStopAll"
>;

export type ExerciseSchedulerFactory = (
  options: LookaheadSchedulerOptions<ExercisePlaybackEvent>,
) => LookaheadScheduler;

export type ExerciseMetronomeSchedulerFactory = (
  options: LookaheadSchedulerOptions<true>,
) => LookaheadScheduler;

const idleSnapshot: ExercisePlaybackSnapshot = {
  events: [],
  playing: false,
};

function withoutPendingStart(
  snapshot: ExercisePlaybackSnapshot,
): ExercisePlaybackSnapshot {
  const nextSnapshot = { ...snapshot };
  delete nextSnapshot.pendingId;
  return nextSnapshot;
}

export function isExercisePlaybackActive(
  snapshot: ExercisePlaybackSnapshot,
  id: string,
) {
  return (
    snapshot.pendingId === id || (snapshot.playing && snapshot.activeId === id)
  );
}

export function exercisePlaybackRequestsAreEqual(
  left: ExercisePlaybackRequest,
  right: ExercisePlaybackRequest,
) {
  return (
    left.countInBeats === right.countInBeats &&
    left.id === right.id &&
    left.metronomeEnabled === right.metronomeEnabled &&
    left.presetId === right.presetId &&
    normalizeTempo(left.tempoBpm) === normalizeTempo(right.tempoBpm) &&
    left.events.length === right.events.length &&
    left.events.every((event, index) => {
      const other = right.events[index];

      return (
        other !== undefined &&
        event.durationBeats === other.durationBeats &&
        event.midi === other.midi &&
        event.offsetBeats === other.offsetBeats &&
        event.stepIndex === other.stepIndex
      );
    })
  );
}

function normalizeTempo(tempoBpm: number) {
  return Math.min(300, Math.max(30, Math.round(tempoBpm)));
}

function getCycleDuration(events: readonly ExercisePlaybackEvent[]) {
  return events.reduce(
    (duration, event) =>
      Math.max(duration, event.offsetBeats + event.durationBeats),
    0,
  );
}

function toSchedulerEvents(
  events: readonly ExercisePlaybackEvent[],
  secondsPerBeat: number,
): LookaheadSchedulerEvent<ExercisePlaybackEvent>[] {
  return events.map((event) => ({
    duration: event.durationBeats * secondsPerBeat,
    offset: event.offsetBeats * secondsPerBeat,
    payload: event,
  }));
}

export class ExercisePlaybackCoordinator {
  private active: ActiveExercisePlayback | undefined;
  private listeners = new Set<() => void>();
  private pendingStartId: string | undefined;
  private snapshot: ExercisePlaybackSnapshot = idleSnapshot;
  private startRevision = 0;

  constructor(
    private readonly audioEngine: ExercisePlaybackAudioEngine = musoAudioEngine,
    private readonly createScheduler: ExerciseSchedulerFactory = createLookaheadScheduler,
    private readonly createMetronomeScheduler: ExerciseMetronomeSchedulerFactory = createLookaheadScheduler,
  ) {
    this.audioEngine.subscribeToReset(() => this.reset());
    this.audioEngine.subscribeToStopAll(() => this.reset());
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private reset() {
    this.active?.noteScheduler.stop();
    this.active?.metronomeScheduler?.stop();
    this.active = undefined;
    this.pendingStartId = undefined;
    this.snapshot = idleSnapshot;
    this.startRevision += 1;
    this.emit();
  }

  getSnapshot = () => this.snapshot;

  getActiveStepIndex(outputContextTime: number) {
    const { cycleDuration, events, originTime, playing, secondsPerBeat } =
      this.snapshot;

    if (
      !playing ||
      originTime === undefined ||
      cycleDuration === undefined ||
      secondsPerBeat === undefined ||
      events.length === 0 ||
      outputContextTime < originTime
    ) {
      return undefined;
    }

    const positionBeats =
      ((outputContextTime - originTime) / secondsPerBeat) % cycleDuration;

    return events.find(
      (event) =>
        positionBeats >= event.offsetBeats &&
        positionBeats < event.offsetBeats + event.durationBeats,
    )?.stepIndex;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async start(request: ExercisePlaybackRequest) {
    const revision = ++this.startRevision;
    this.pendingStartId = request.id;
    this.snapshot = {
      ...this.snapshot,
      pendingId: request.id,
    };
    this.emit();
    const prepared = await this.audioEngine.prime();
    const currentTime = this.audioEngine.getCurrentTime();

    if (
      !prepared ||
      currentTime === undefined ||
      revision !== this.startRevision
    ) {
      if (revision === this.startRevision) {
        this.pendingStartId = undefined;
        this.snapshot = withoutPendingStart(this.snapshot);
        this.emit();
      }
      return false;
    }

    const cycleDuration = getCycleDuration(request.events);

    if (request.events.length === 0 || cycleDuration <= 0) {
      this.pendingStartId = undefined;
      this.snapshot = withoutPendingStart(this.snapshot);
      this.emit();
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const previous = this.active;
    const countInStartTime = currentTime + START_LOOKAHEAD_SECONDS;
    const originTime = countInStartTime + request.countInBeats * secondsPerBeat;

    previous?.noteScheduler.stop();
    previous?.metronomeScheduler?.stop();
    if (previous) {
      this.audioEngine.cancelPlaybackGroup(previous.group);
    }

    const group = this.audioEngine.createPlaybackGroup();
    for (let beatIndex = 0; beatIndex < request.countInBeats; beatIndex += 1) {
      this.audioEngine.scheduleMetronomeClick({
        accent: beatIndex === 0,
        group,
        startTime: countInStartTime + beatIndex * secondsPerBeat,
      });
    }
    const noteScheduler = this.createScheduler({
      events: toSchedulerEvents(request.events, secondsPerBeat),
      getCurrentTime: this.audioEngine.getCurrentTime,
      onSchedule: (scheduledEvent, startTime) => {
        this.audioEngine.scheduleNote({
          durationSeconds: scheduledEvent.duration * NOTE_GATE_RATIO,
          group,
          midiNote: scheduledEvent.payload.midi,
          presetId: request.presetId,
          startTime,
          use: "exercise",
          velocity: 0.76,
        });
      },
    });
    const metronomeScheduler = request.metronomeEnabled
      ? this.createMetronomeScheduler({
          // A one-beat cycle keeps the click grid steady when an exercise loop
          // has a fractional length, as triplet exercises often do.
          events: [
            {
              duration: secondsPerBeat,
              offset: 0,
              payload: true,
            },
          ],
          getCurrentTime: this.audioEngine.getCurrentTime,
          onSchedule: (_scheduledEvent, startTime) => {
            this.audioEngine.scheduleMetronomeClick({
              accent: false,
              group,
              startTime,
            });
          },
        })
      : undefined;
    const snapshot: ExercisePlaybackSnapshot = {
      activeId: request.id,
      cycleDuration,
      events: request.events,
      originTime,
      playing: true,
      secondsPerBeat,
    };

    this.active = {
      group,
      metronomeScheduler,
      noteScheduler,
      snapshot,
    };
    this.pendingStartId = undefined;
    this.snapshot = snapshot;
    noteScheduler.start(originTime);
    metronomeScheduler?.start(originTime);
    this.emit();
    return true;
  }

  stop(id?: string) {
    const stopsActive =
      this.active !== undefined &&
      (id === undefined || id === this.snapshot.activeId);
    const stopsPending =
      this.pendingStartId !== undefined &&
      (id === undefined || id === this.pendingStartId);

    if (!stopsActive && !stopsPending) {
      return;
    }

    if (stopsPending) {
      this.pendingStartId = undefined;
      this.startRevision += 1;
    }

    if (stopsActive && this.active) {
      const active = this.active;
      active.noteScheduler.stop();
      active.metronomeScheduler?.stop();
      this.audioEngine.cancelPlaybackGroup(active.group);
      this.active = undefined;
      this.snapshot = this.pendingStartId
        ? { ...idleSnapshot, pendingId: this.pendingStartId }
        : idleSnapshot;
    } else if (stopsPending) {
      this.snapshot = withoutPendingStart(this.snapshot);
    }

    this.emit();
  }
}

export const exercisePlaybackCoordinator = new ExercisePlaybackCoordinator();
