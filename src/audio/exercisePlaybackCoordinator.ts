import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
} from "./lookaheadScheduler";
import { musoAudioEngine } from "./createWebAudioEngine";
import { type AudioPresetId, type PlaybackGroupHandle } from "./types";

const START_LOOKAHEAD_SECONDS = 0.08;
const NOTE_GATE_RATIO = 0.9;

export interface ExercisePlaybackEvent {
  durationBeats: number;
  midi: number;
  offsetBeats: number;
  stepIndex: number;
}

export interface ExercisePlaybackRequest {
  countInBeats: number;
  events: readonly ExercisePlaybackEvent[];
  id: string;
  metronomeEnabled: boolean;
  presetId: AudioPresetId;
  tempoBpm: number;
}

export interface ExercisePlaybackSnapshot {
  activeId?: string;
  countInEndTime?: number;
  cycleDuration?: number;
  events: readonly ExercisePlaybackEvent[];
  originTime?: number;
  playing: boolean;
  secondsPerBeat?: number;
}

interface ActiveExercisePlayback {
  group: PlaybackGroupHandle;
  metronomeScheduler?: LookaheadScheduler;
  noteScheduler: LookaheadScheduler;
  snapshot: ExercisePlaybackSnapshot;
}

const idleSnapshot: ExercisePlaybackSnapshot = {
  events: [],
  playing: false,
};

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

class ExercisePlaybackCoordinator {
  private active: ActiveExercisePlayback | undefined;
  private listeners = new Set<() => void>();
  private retiringGroups = new Map<PlaybackGroupHandle, number>();
  private snapshot: ExercisePlaybackSnapshot = idleSnapshot;
  private startRevision = 0;

  constructor() {
    musoAudioEngine.subscribeToReset(() => this.reset());
    musoAudioEngine.subscribeToStopAll(() => this.reset());
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private reset() {
    this.active?.noteScheduler.stop();
    this.active?.metronomeScheduler?.stop();
    this.retiringGroups.forEach((timer) => window.clearTimeout(timer));
    this.retiringGroups.clear();
    this.active = undefined;
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
    const prepared = await musoAudioEngine.prime();
    const currentTime = musoAudioEngine.getCurrentTime();

    if (
      !prepared ||
      currentTime === undefined ||
      revision !== this.startRevision
    ) {
      return false;
    }

    const cycleDuration = getCycleDuration(request.events);

    if (request.events.length === 0 || cycleDuration <= 0) {
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const previous = this.active;
    const shouldHandoff = previous !== undefined;
    const previousOriginTime = previous?.snapshot.originTime;
    const previousSecondsPerBeat = previous?.snapshot.secondsPerBeat;
    const nextBeatTime =
      previousOriginTime !== undefined && previousSecondsPerBeat !== undefined
        ? previousOriginTime +
          Math.max(
            0,
            Math.ceil(
              (currentTime - previousOriginTime) / previousSecondsPerBeat +
                0.0001,
            ),
          ) *
            previousSecondsPerBeat
        : currentTime + START_LOOKAHEAD_SECONDS;
    const countInBeats = shouldHandoff
      ? 0
      : Math.min(8, Math.max(0, Math.round(request.countInBeats)));
    const countInStartTime = shouldHandoff
      ? nextBeatTime
      : currentTime + START_LOOKAHEAD_SECONDS;
    const originTime = countInStartTime + countInBeats * secondsPerBeat;
    const group = musoAudioEngine.createPlaybackGroup();

    previous?.noteScheduler.stop();
    previous?.metronomeScheduler?.stop();
    if (previous) {
      const delayMilliseconds = Math.max(0, (originTime - currentTime) * 1000);
      const timer = window.setTimeout(() => {
        this.retiringGroups.delete(previous.group);
        musoAudioEngine.cancelPlaybackGroup(previous.group);
      }, delayMilliseconds);
      this.retiringGroups.set(previous.group, timer);
    }

    if (request.metronomeEnabled) {
      for (let beat = 0; beat < countInBeats; beat += 1) {
        musoAudioEngine.scheduleMetronomeClick({
          accent: beat === 0,
          group,
          startTime: countInStartTime + beat * secondsPerBeat,
        });
      }
    }

    const noteScheduler = createLookaheadScheduler({
      events: toSchedulerEvents(request.events, secondsPerBeat),
      getCurrentTime: musoAudioEngine.getCurrentTime,
      onSchedule: (scheduledEvent, startTime) => {
        musoAudioEngine.scheduleNote({
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
      ? createLookaheadScheduler({
          events: [{ duration: secondsPerBeat, offset: 0, payload: true }],
          getCurrentTime: musoAudioEngine.getCurrentTime,
          onSchedule: (_event, startTime) => {
            musoAudioEngine.scheduleMetronomeClick({
              group,
              startTime,
            });
          },
        })
      : undefined;
    const snapshot: ExercisePlaybackSnapshot = {
      activeId: request.id,
      countInEndTime: originTime,
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
    this.snapshot = snapshot;
    noteScheduler.start(originTime);
    metronomeScheduler?.start(originTime);
    this.emit();
    return true;
  }

  stop(id?: string) {
    if (!this.active || (id !== undefined && id !== this.snapshot.activeId)) {
      return;
    }

    const active = this.active;
    active.noteScheduler.stop();
    active.metronomeScheduler?.stop();
    musoAudioEngine.cancelPlaybackGroup(active.group);
    this.retiringGroups.forEach((timer, group) => {
      window.clearTimeout(timer);
      musoAudioEngine.cancelPlaybackGroup(group);
    });
    this.retiringGroups.clear();
    this.active = undefined;
    this.snapshot = idleSnapshot;
    this.startRevision += 1;
    this.emit();
  }
}

export const exercisePlaybackCoordinator = new ExercisePlaybackCoordinator();
