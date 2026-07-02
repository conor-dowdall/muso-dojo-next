import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
import { AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS } from "./audioTimingConfig";
import { musoAudioEngine } from "./createWebAudioEngine";
import { AUDIO_STOP_RELEASE_SECONDS } from "./audioStopConfig";
import {
  type AudioEngine,
  type AudioPresetId,
  type PlaybackGroupHandle,
} from "./types";
import { type PlaybackOwner } from "./playbackOwnership";
import { type ExerciseCountInBeats } from "@/types/session";

const START_LOOKAHEAD_SECONDS = 0.08;
const NOTE_GATE_RATIO = 0.9;
const HANDOFF_COMMIT_LEAD_SECONDS = AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS;

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
  countInBeats?: ExerciseCountInBeats;
  countInStartTime?: number;
  cycleDuration?: number;
  events: readonly ExercisePlaybackEvent[];
  originTime?: number;
  owner?: PlaybackOwner;
  pendingId?: string;
  pendingOwner?: PlaybackOwner;
  pendingOriginTime?: number;
  playing: boolean;
  secondsPerBeat?: number;
}

export interface ExercisePlaybackStartOptions {
  handoff?: boolean;
  originTime?: number;
  owner?: PlaybackOwner;
}

interface ActiveExercisePlayback {
  countInGroup?: PlaybackGroupHandle;
  metronomeGroup?: PlaybackGroupHandle;
  metronomeScheduler?: LookaheadScheduler;
  noteGroup: PlaybackGroupHandle;
  noteScheduler: LookaheadScheduler;
  request: ExercisePlaybackRequest;
  snapshot: ExercisePlaybackSnapshot;
}

interface PendingExerciseHandoff {
  playback: ActiveExercisePlayback;
  revision: number;
  snapshot: ExercisePlaybackSnapshot;
  timer: ReturnType<typeof globalThis.setTimeout>;
}

interface PendingExerciseStop {
  active: ActiveExercisePlayback;
  timer: ReturnType<typeof globalThis.setTimeout>;
}

export type ExercisePlaybackAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "scheduleMetronomeClick"
  | "scheduleNote"
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
  delete nextSnapshot.pendingOwner;
  delete nextSnapshot.pendingOriginTime;
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

export function getExercisePlaybackOwner(
  snapshot: ExercisePlaybackSnapshot,
  id: string,
) {
  if (snapshot.pendingId === id) {
    return snapshot.pendingOwner;
  }

  return snapshot.playing && snapshot.activeId === id
    ? snapshot.owner
    : undefined;
}

export function exercisePlaybackRestartRequestsAreEqual(
  left: ExercisePlaybackRequest,
  right: ExercisePlaybackRequest,
) {
  return (
    left.id === right.id &&
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
  private pendingHandoff: PendingExerciseHandoff | undefined;
  private pendingStop: PendingExerciseStop | undefined;
  private pendingStartId: string | undefined;
  private pendingStartOwner: PlaybackOwner | undefined;
  private pendingStartRequest: ExercisePlaybackRequest | undefined;
  private snapshot: ExercisePlaybackSnapshot = idleSnapshot;
  private startRevision = 0;

  constructor(
    private readonly audioEngine: ExercisePlaybackAudioEngine = musoAudioEngine,
    private readonly createScheduler: ExerciseSchedulerFactory = createLookaheadScheduler,
    private readonly createMetronomeScheduler: ExerciseMetronomeSchedulerFactory = createLookaheadScheduler,
  ) {
    this.audioEngine.subscribeToStopAll(() => this.reset());
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private reset() {
    this.cancelPendingHandoff();
    this.cancelPendingStopTimer();
    if (this.active) {
      this.stopActivePlayback(this.active);
    }
    this.active = undefined;
    this.pendingStartId = undefined;
    this.pendingStartOwner = undefined;
    this.pendingStartRequest = undefined;
    this.snapshot = idleSnapshot;
    this.startRevision += 1;
    this.emit();
  }

  getSnapshot = () => this.snapshot;

  getActiveRequest = () => this.active?.request;

  getPendingRequest = () => this.pendingStartRequest;

  getCurrentTime = () => this.audioEngine.getCurrentTime();

  private cancelGroup(
    group: PlaybackGroupHandle | undefined,
    options?: { atTime?: number; releaseSeconds?: number },
  ) {
    if (group) {
      this.audioEngine.cancelPlaybackGroup(group, options);
    }
  }

  private cancelPendingStopTimer() {
    if (!this.pendingStop) {
      return;
    }

    globalThis.clearTimeout(this.pendingStop.timer);
    this.pendingStop = undefined;
  }

  private commitPendingStop(active: ActiveExercisePlayback) {
    if (this.pendingStop?.active !== active) {
      return;
    }

    this.pendingStop = undefined;

    if (this.active !== active) {
      return;
    }

    active.noteScheduler.stop();
    active.metronomeScheduler?.stop();
    this.active = undefined;
    this.snapshot = this.pendingStartId
      ? {
          ...idleSnapshot,
          pendingId: this.pendingStartId,
          ...(this.pendingStartOwner
            ? { pendingOwner: this.pendingStartOwner }
            : {}),
        }
      : idleSnapshot;
    this.emit();
  }

  private scheduleActivePlaybackStop(
    active: ActiveExercisePlayback,
    options: { atTime: number; releaseSeconds?: number },
  ) {
    const currentTime = this.audioEngine.getCurrentTime();

    if (
      currentTime === undefined ||
      options.atTime <= currentTime + HANDOFF_COMMIT_LEAD_SECONDS
    ) {
      this.stopActivePlayback(active, {
        releaseSeconds: options.releaseSeconds,
      });
      return;
    }

    this.cancelPendingStopTimer();
    this.cancelGroup(active.countInGroup, options);
    this.cancelGroup(active.metronomeGroup, options);
    this.cancelGroup(active.noteGroup, options);

    this.pendingStop = {
      active,
      timer: globalThis.setTimeout(
        () => this.commitPendingStop(active),
        Math.max(0, (options.atTime - currentTime) * 1000),
      ),
    };
  }

  private stopActivePlayback(
    active: ActiveExercisePlayback,
    options?: { atTime?: number; releaseSeconds?: number },
  ) {
    if (options?.atTime !== undefined) {
      this.scheduleActivePlaybackStop(active, {
        atTime: options.atTime,
        releaseSeconds: options.releaseSeconds,
      });
      return;
    }

    this.cancelPendingStopTimer();
    active.noteScheduler.stop();
    active.metronomeScheduler?.stop();
    this.cancelGroup(active.countInGroup, options);
    this.cancelGroup(active.metronomeGroup, options);
    this.cancelGroup(active.noteGroup, options);
  }

  private cancelPendingHandoff() {
    if (!this.pendingHandoff) {
      return;
    }

    globalThis.clearTimeout(this.pendingHandoff.timer);
    this.stopActivePlayback(this.pendingHandoff.playback);
    this.pendingHandoff = undefined;
  }

  private commitPendingHandoff(revision: number) {
    const pendingHandoff = this.pendingHandoff;

    if (!pendingHandoff || pendingHandoff.revision !== revision) {
      return;
    }

    if (this.active) {
      this.stopActivePlayback(this.active, {
        atTime: pendingHandoff.snapshot.originTime,
        releaseSeconds: AUDIO_STOP_RELEASE_SECONDS,
      });
    }

    this.active = pendingHandoff.playback;
    this.pendingHandoff = undefined;
    this.pendingStartId = undefined;
    this.pendingStartOwner = undefined;
    this.pendingStartRequest = undefined;
    this.snapshot = pendingHandoff.snapshot;
    this.emit();
  }

  cancelPendingStart() {
    if (this.pendingStartId === undefined) {
      return;
    }

    this.cancelPendingHandoff();
    this.pendingStartId = undefined;
    this.pendingStartOwner = undefined;
    this.pendingStartRequest = undefined;
    this.startRevision += 1;
    this.snapshot = withoutPendingStart(this.snapshot);
    this.emit();
  }

  private createNoteScheduler({
    group,
    request,
    secondsPerBeat,
  }: {
    group: PlaybackGroupHandle;
    request: ExercisePlaybackRequest;
    secondsPerBeat: number;
  }) {
    return this.createScheduler({
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
  }

  private createMetronomeClickScheduler({
    group,
    secondsPerBeat,
  }: {
    group: PlaybackGroupHandle;
    secondsPerBeat: number;
  }) {
    return this.createMetronomeScheduler({
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
    });
  }

  private scheduleCountIn({
    countInBeats,
    countInStartTime,
    group,
    secondsPerBeat,
    earliestStartTime = Number.NEGATIVE_INFINITY,
  }: {
    countInBeats: ExerciseCountInBeats;
    countInStartTime: number;
    group: PlaybackGroupHandle;
    secondsPerBeat: number;
    earliestStartTime?: number;
  }) {
    for (let beatIndex = 0; beatIndex < countInBeats; beatIndex += 1) {
      const startTime = countInStartTime + beatIndex * secondsPerBeat;

      if (startTime < earliestStartTime) {
        continue;
      }

      this.audioEngine.scheduleMetronomeClick({
        accent: beatIndex === 0,
        group,
        startTime,
      });
    }
  }

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

  async start(
    request: ExercisePlaybackRequest,
    options: ExercisePlaybackStartOptions = {},
  ) {
    const revision = ++this.startRevision;
    this.cancelPendingHandoff();
    this.cancelPendingStopTimer();
    this.pendingStartId = request.id;
    this.pendingStartOwner = options.owner ?? "manual";
    this.pendingStartRequest = request;
    this.snapshot = {
      ...this.snapshot,
      pendingId: request.id,
      pendingOwner: options.owner ?? "manual",
      ...(options.originTime === undefined
        ? {}
        : { pendingOriginTime: options.originTime }),
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
        this.pendingStartOwner = undefined;
        this.pendingStartRequest = undefined;
        this.snapshot = withoutPendingStart(this.snapshot);
        this.emit();
      }
      return false;
    }

    const cycleDuration = getCycleDuration(request.events);

    if (request.events.length === 0 || cycleDuration <= 0) {
      this.pendingStartId = undefined;
      this.pendingStartOwner = undefined;
      this.pendingStartRequest = undefined;
      this.snapshot = withoutPendingStart(this.snapshot);
      this.emit();
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const countInStartTime =
      options.originTime === undefined
        ? currentTime + START_LOOKAHEAD_SECONDS
        : options.originTime - request.countInBeats * secondsPerBeat;
    const originTime =
      options.originTime ??
      countInStartTime + request.countInBeats * secondsPerBeat;

    const previous = this.active;
    const shouldHandoff =
      options.handoff === true &&
      previous !== undefined &&
      originTime > currentTime + HANDOFF_COMMIT_LEAD_SECONDS;

    if (previous && !shouldHandoff) {
      this.stopActivePlayback(previous);
    }

    const countInGroup =
      request.countInBeats > 0
        ? this.audioEngine.createPlaybackGroup()
        : undefined;
    const noteGroup = this.audioEngine.createPlaybackGroup();
    const metronomeGroup = request.metronomeEnabled
      ? this.audioEngine.createPlaybackGroup()
      : undefined;

    if (countInGroup) {
      this.scheduleCountIn({
        countInBeats: request.countInBeats,
        countInStartTime,
        ...(options.originTime === undefined
          ? {}
          : {
              earliestStartTime:
                currentTime + AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS,
            }),
        group: countInGroup,
        secondsPerBeat,
      });
    }
    const noteScheduler = this.createNoteScheduler({
      group: noteGroup,
      request,
      secondsPerBeat,
    });
    const metronomeScheduler = metronomeGroup
      ? this.createMetronomeClickScheduler({
          group: metronomeGroup,
          secondsPerBeat,
        })
      : undefined;
    const snapshot: ExercisePlaybackSnapshot = {
      activeId: request.id,
      ...(request.countInBeats > 0
        ? { countInBeats: request.countInBeats, countInStartTime }
        : {}),
      cycleDuration,
      events: request.events,
      originTime,
      owner: options.owner ?? "manual",
      playing: true,
      secondsPerBeat,
    };

    const nextActive = {
      countInGroup,
      metronomeGroup,
      metronomeScheduler,
      noteGroup,
      noteScheduler,
      request,
      snapshot,
    };
    noteScheduler.start(originTime);
    metronomeScheduler?.start(originTime);
    if (shouldHandoff) {
      const commitDelayMilliseconds = Math.max(
        0,
        (originTime - currentTime - HANDOFF_COMMIT_LEAD_SECONDS) * 1000,
      );

      this.pendingHandoff = {
        playback: nextActive,
        revision,
        snapshot,
        timer: globalThis.setTimeout(
          () => this.commitPendingHandoff(revision),
          commitDelayMilliseconds,
        ),
      };
      this.snapshot = {
        ...previous.snapshot,
        pendingId: request.id,
        pendingOwner: options.owner ?? "manual",
        pendingOriginTime: originTime,
      };
      this.emit();
      return true;
    }

    this.active = nextActive;
    this.pendingStartId = undefined;
    this.pendingStartOwner = undefined;
    this.pendingStartRequest = undefined;
    this.snapshot = snapshot;
    this.emit();
    return true;
  }

  setMetronomeEnabled(id: string, enabled: boolean) {
    const active = this.active;

    if (!active || active.snapshot.activeId !== id) {
      return false;
    }

    const isEnabled = active.metronomeScheduler !== undefined;

    if (isEnabled === enabled) {
      return true;
    }

    active.metronomeScheduler?.stop();
    this.cancelGroup(active.metronomeGroup);
    active.metronomeScheduler = undefined;
    active.metronomeGroup = undefined;

    if (enabled) {
      const { originTime, secondsPerBeat } = active.snapshot;

      if (originTime === undefined || secondsPerBeat === undefined) {
        return false;
      }

      const metronomeGroup = this.audioEngine.createPlaybackGroup();
      const metronomeScheduler = this.createMetronomeClickScheduler({
        group: metronomeGroup,
        secondsPerBeat,
      });

      active.metronomeGroup = metronomeGroup;
      active.metronomeScheduler = metronomeScheduler;
      metronomeScheduler.start(originTime);
    }

    active.request = {
      ...active.request,
      metronomeEnabled: enabled,
    };
    active.snapshot = {
      ...active.snapshot,
    };
    this.snapshot = active.snapshot;
    this.emit();
    return true;
  }

  stop(id?: string, options?: { atTime?: number; releaseSeconds?: number }) {
    const pendingHandoff = this.pendingHandoff;
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
      this.cancelPendingHandoff();
      this.pendingStartId = undefined;
      this.pendingStartOwner = undefined;
      this.pendingStartRequest = undefined;
      this.startRevision += 1;
    } else if (stopsActive && pendingHandoff) {
      this.cancelPendingHandoff();
      this.pendingStartId = undefined;
      this.pendingStartOwner = undefined;
      this.pendingStartRequest = undefined;
      this.startRevision += 1;
    }

    if (stopsActive && this.active) {
      const active = this.active;
      this.stopActivePlayback(active, {
        atTime: options?.atTime,
        releaseSeconds: options?.releaseSeconds ?? AUDIO_STOP_RELEASE_SECONDS,
      });
      if (options?.atTime === undefined) {
        this.active = undefined;
        this.snapshot = this.pendingStartId
          ? {
              ...idleSnapshot,
              pendingId: this.pendingStartId,
              ...(this.pendingStartOwner
                ? { pendingOwner: this.pendingStartOwner }
                : {}),
            }
          : idleSnapshot;
      }
    } else if (stopsPending) {
      this.snapshot = withoutPendingStart(this.snapshot);
    }

    this.emit();
  }
}

export const exercisePlaybackCoordinator = new ExercisePlaybackCoordinator();
