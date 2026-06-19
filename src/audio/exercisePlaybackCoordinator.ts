import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
import { AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS } from "./audioTimingConfig";
import { musoAudioEngine } from "./createWebAudioEngine";
import {
  type AudioEngine,
  type AudioPresetId,
  type PlaybackGroupHandle,
} from "./types";
import { type ExerciseCountInBeats } from "@/types/session";

const START_LOOKAHEAD_SECONDS = 0.08;
const NOTE_GATE_RATIO = 0.9;
const STOP_RELEASE_SECONDS = 0.08;

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
  pendingId?: string;
  playing: boolean;
  secondsPerBeat?: number;
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

export function exercisePlaybackRestartRequestsAreEqual(
  left: ExercisePlaybackRequest,
  right: ExercisePlaybackRequest,
) {
  return (
    left.id === right.id &&
    left.presetId === right.presetId &&
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
    this.audioEngine.subscribeToStopAll(() => this.reset());
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private reset() {
    if (this.active) {
      this.stopActivePlayback(this.active);
    }
    this.active = undefined;
    this.pendingStartId = undefined;
    this.snapshot = idleSnapshot;
    this.startRevision += 1;
    this.emit();
  }

  getSnapshot = () => this.snapshot;

  private cancelGroup(
    group: PlaybackGroupHandle | undefined,
    options?: { releaseSeconds?: number },
  ) {
    if (group) {
      this.audioEngine.cancelPlaybackGroup(group, options);
    }
  }

  private stopActivePlayback(
    active: ActiveExercisePlayback,
    options?: { releaseSeconds?: number },
  ) {
    active.noteScheduler.stop();
    active.metronomeScheduler?.stop();
    this.cancelGroup(active.countInGroup);
    this.cancelGroup(active.metronomeGroup);
    this.cancelGroup(active.noteGroup, options);
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
    const countInStartTime = currentTime + START_LOOKAHEAD_SECONDS;
    const originTime = countInStartTime + request.countInBeats * secondsPerBeat;

    const previous = this.active;
    if (previous) {
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
      playing: true,
      secondsPerBeat,
    };

    this.active = {
      countInGroup,
      metronomeGroup,
      metronomeScheduler,
      noteGroup,
      noteScheduler,
      request,
      snapshot,
    };
    this.pendingStartId = undefined;
    this.snapshot = snapshot;
    noteScheduler.start(originTime);
    metronomeScheduler?.start(originTime);
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

  setTempo(id: string, tempoBpm: number) {
    const active = this.active;
    const currentTime = this.audioEngine.getCurrentTime();

    if (
      !active ||
      active.snapshot.activeId !== id ||
      currentTime === undefined
    ) {
      return false;
    }

    const nextTempoBpm = normalizeTempo(tempoBpm);
    const currentTempoBpm = normalizeTempo(active.request.tempoBpm);

    if (nextTempoBpm === currentTempoBpm) {
      return true;
    }

    const { countInBeats, countInStartTime, originTime, secondsPerBeat } =
      active.snapshot;

    if (originTime === undefined || secondsPerBeat === undefined) {
      return false;
    }

    const nextSecondsPerBeat = 60 / nextTempoBpm;
    let nextCountInStartTime = countInStartTime;
    let nextOriginTime = originTime;

    if (
      countInBeats !== undefined &&
      countInBeats > 0 &&
      countInStartTime !== undefined &&
      currentTime < originTime
    ) {
      const countInPositionBeats = Math.max(
        0,
        (currentTime - countInStartTime) / secondsPerBeat,
      );
      nextCountInStartTime =
        currentTime - countInPositionBeats * nextSecondsPerBeat;
      nextOriginTime = nextCountInStartTime + countInBeats * nextSecondsPerBeat;
    } else {
      const positionBeats = Math.max(
        0,
        (currentTime - originTime) / secondsPerBeat,
      );
      nextOriginTime = currentTime - positionBeats * nextSecondsPerBeat;
    }

    active.noteScheduler.stop();
    active.metronomeScheduler?.stop();
    this.cancelGroup(active.countInGroup);
    this.cancelGroup(active.metronomeGroup);
    this.cancelGroup(active.noteGroup, {
      releaseSeconds: STOP_RELEASE_SECONDS,
    });

    const nextRequest = {
      ...active.request,
      tempoBpm: nextTempoBpm,
    };
    const continuesCountIn =
      countInBeats !== undefined &&
      countInBeats > 0 &&
      nextCountInStartTime !== undefined &&
      currentTime < originTime;
    const nextCountInGroup = continuesCountIn
      ? this.audioEngine.createPlaybackGroup()
      : undefined;
    const nextNoteGroup = this.audioEngine.createPlaybackGroup();
    const nextMetronomeGroup = active.request.metronomeEnabled
      ? this.audioEngine.createPlaybackGroup()
      : undefined;

    if (
      nextCountInGroup &&
      nextCountInStartTime !== undefined &&
      countInBeats !== undefined
    ) {
      this.scheduleCountIn({
        countInBeats,
        countInStartTime: nextCountInStartTime,
        earliestStartTime: currentTime + AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS,
        group: nextCountInGroup,
        secondsPerBeat: nextSecondsPerBeat,
      });
    }

    const nextNoteScheduler = this.createNoteScheduler({
      group: nextNoteGroup,
      request: nextRequest,
      secondsPerBeat: nextSecondsPerBeat,
    });
    const nextMetronomeScheduler = nextMetronomeGroup
      ? this.createMetronomeClickScheduler({
          group: nextMetronomeGroup,
          secondsPerBeat: nextSecondsPerBeat,
        })
      : undefined;

    active.countInGroup = nextCountInGroup;
    active.metronomeGroup = nextMetronomeGroup;
    active.metronomeScheduler = nextMetronomeScheduler;
    active.noteGroup = nextNoteGroup;
    active.noteScheduler = nextNoteScheduler;
    active.request = nextRequest;
    active.snapshot = {
      ...active.snapshot,
      ...(nextCountInStartTime !== undefined &&
      countInBeats !== undefined &&
      countInBeats > 0 &&
      currentTime < originTime
        ? { countInStartTime: nextCountInStartTime }
        : {}),
      originTime: nextOriginTime,
      secondsPerBeat: nextSecondsPerBeat,
    };
    this.snapshot = active.snapshot;
    nextNoteScheduler.start(nextOriginTime);
    nextMetronomeScheduler?.start(nextOriginTime);
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
      this.stopActivePlayback(active, {
        releaseSeconds: STOP_RELEASE_SECONDS,
      });
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
