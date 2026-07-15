import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
import {
  AUDIO_PLAYBACK_START_LEAD_SECONDS,
  AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS,
} from "./audioTimingConfig";
import { musoAudioEngine } from "./createWebAudioEngine";
import { AUDIO_STOP_RELEASE_SECONDS } from "./audioStopConfig";
import {
  type AudioEngine,
  type AudioPresetId,
  type PlaybackGroupHandle,
} from "./types";
import { type PlaybackOwner } from "./playbackOwnership";
import { type ExerciseCountInBeats } from "@/types/session";

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

export interface ExercisePlaybackInstanceSnapshot {
  activeId: string;
  countInBeats: ExerciseCountInBeats;
  countInStartTime: number;
  cycleDuration: number;
  events: readonly ExercisePlaybackEvent[];
  originTime: number;
  owner: PlaybackOwner;
  playing: true;
  secondsPerBeat: number;
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
  pendingIds: readonly string[];
  pendingOwners?: Readonly<Record<string, PlaybackOwner>>;
  pendingOwner?: PlaybackOwner;
  pendingOriginTime?: number;
  playbacks: Readonly<Record<string, ExercisePlaybackInstanceSnapshot>>;
  playing: boolean;
  secondsPerBeat?: number;
}

export interface ExercisePlaybackStartOptions {
  handoff?: boolean;
  originTime?: number;
  owner?: PlaybackOwner;
  prepared?: boolean;
}

interface ActiveExercisePlayback {
  countInGroup?: PlaybackGroupHandle;
  metronomeGroup?: PlaybackGroupHandle;
  metronomeScheduler?: LookaheadScheduler;
  noteGroup: PlaybackGroupHandle;
  noteScheduler: LookaheadScheduler;
  request: ExercisePlaybackRequest;
  snapshot: ExercisePlaybackInstanceSnapshot;
  stopTimer?: ReturnType<typeof globalThis.setTimeout>;
  visualPredecessor?: ExercisePlaybackInstanceSnapshot;
}

interface PendingExerciseStart {
  originTime?: number;
  owner: PlaybackOwner;
  request: ExercisePlaybackRequest;
  revision: number;
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
> &
  Partial<Pick<AudioEngine, "clearPlaybackGroupCancellation">>;

export type ExerciseSchedulerFactory = (
  options: LookaheadSchedulerOptions<ExercisePlaybackEvent>,
) => LookaheadScheduler;

export type ExerciseMetronomeSchedulerFactory = (
  options: LookaheadSchedulerOptions<true>,
) => LookaheadScheduler;

const idleSnapshot: ExercisePlaybackSnapshot = {
  events: [],
  pendingIds: [],
  playbacks: {},
  playing: false,
};

export function isExercisePlaybackActive(
  snapshot: ExercisePlaybackSnapshot,
  id: string,
) {
  return (
    snapshot.playbacks[id] !== undefined || snapshot.pendingIds.includes(id)
  );
}

export function getExercisePlaybackOwner(
  snapshot: ExercisePlaybackSnapshot,
  id: string,
) {
  return (
    snapshot.playbacks[id]?.owner ??
    snapshot.pendingOwners?.[id] ??
    (snapshot.pendingId === id ? snapshot.pendingOwner : undefined)
  );
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
  private active = new Map<string, ActiveExercisePlayback>();
  private listeners = new Set<() => void>();
  private pending = new Map<string, PendingExerciseStart>();
  private revisions = new Map<string, number>();
  private snapshot: ExercisePlaybackSnapshot = idleSnapshot;
  private latestId: string | undefined;

  constructor(
    private readonly audioEngine: ExercisePlaybackAudioEngine = musoAudioEngine,
    private readonly createScheduler: ExerciseSchedulerFactory = createLookaheadScheduler,
    private readonly createMetronomeScheduler: ExerciseMetronomeSchedulerFactory = createLookaheadScheduler,
  ) {
    this.audioEngine.subscribeToStopAll(() => this.reset());
  }

  private nextRevision(id: string) {
    const revision = (this.revisions.get(id) ?? 0) + 1;
    this.revisions.set(id, revision);
    return revision;
  }

  private rebuildSnapshot() {
    const playbacks = Object.fromEntries(
      [...this.active].map(([id, playback]) => [id, playback.snapshot]),
    );
    const pendingEntries = [...this.pending.values()];
    const latestActive = this.latestId
      ? this.active.get(this.latestId)?.snapshot
      : undefined;
    const latestPending = this.latestId
      ? this.pending.get(this.latestId)
      : pendingEntries.at(-1);

    this.snapshot = {
      ...(latestActive ?? {}),
      events: latestActive?.events ?? [],
      ...(latestPending
        ? {
            pendingId: latestPending.request.id,
            pendingOwner: latestPending.owner,
            ...(latestPending.originTime === undefined
              ? {}
              : { pendingOriginTime: latestPending.originTime }),
          }
        : {}),
      pendingIds: pendingEntries.map((entry) => entry.request.id),
      pendingOwners: Object.fromEntries(
        pendingEntries.map((entry) => [entry.request.id, entry.owner]),
      ),
      playbacks,
      playing: this.active.size > 0,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    this.listeners.forEach((listener) => listener());
  }

  private reset() {
    this.pending.clear();
    this.active.forEach((playback) => {
      playback.noteScheduler.stop();
      playback.metronomeScheduler?.stop();
      if (playback.stopTimer) {
        globalThis.clearTimeout(playback.stopTimer);
      }
    });
    this.active.clear();
    this.revisions.forEach((_revision, id) => this.nextRevision(id));
    this.latestId = undefined;
    this.emit();
  }

  getSnapshot = () => this.snapshot;

  getActiveRequest = (id?: string) =>
    this.active.get(id ?? this.latestId ?? "")?.request;

  getPendingRequest = (id?: string) =>
    this.pending.get(id ?? this.latestId ?? "")?.request;

  getActiveIds = (owner?: PlaybackOwner) =>
    [...this.active]
      .filter(
        ([, playback]) =>
          owner === undefined || playback.snapshot.owner === owner,
      )
      .map(([id]) => id);

  getCurrentTime = () => this.audioEngine.getCurrentTime();

  prepare = () => this.audioEngine.prime();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private cancelGroup(
    group: PlaybackGroupHandle | undefined,
    options?: { atTime?: number; releaseSeconds?: number },
  ) {
    if (group) {
      this.audioEngine.cancelPlaybackGroup(group, options);
    }
  }

  private finishPlayback(id: string, playback: ActiveExercisePlayback) {
    playback.noteScheduler.stop();
    playback.metronomeScheduler?.stop();

    if (this.active.get(id) !== playback) {
      return;
    }

    this.active.delete(id);
    this.reconcileMetronome(playback.snapshot.owner);
    if (this.latestId === id) {
      this.latestId = [...this.active.keys()].at(-1);
    }
    this.emit();
  }

  private stopPlayback(
    id: string,
    playback: ActiveExercisePlayback,
    options?: { atTime?: number; releaseSeconds?: number },
  ) {
    if (playback.stopTimer) {
      globalThis.clearTimeout(playback.stopTimer);
      playback.stopTimer = undefined;
    }

    if (options?.atTime !== undefined) {
      this.cancelGroup(playback.countInGroup, options);
      this.cancelGroup(playback.metronomeGroup, options);
      this.cancelGroup(playback.noteGroup, options);
      const currentTime = this.audioEngine.getCurrentTime();

      if (currentTime !== undefined && options.atTime > currentTime) {
        playback.stopTimer = globalThis.setTimeout(
          () => this.finishPlayback(id, playback),
          Math.max(0, (options.atTime - currentTime) * 1000),
        );
        return;
      }
    }

    this.cancelGroup(playback.countInGroup, options);
    this.cancelGroup(playback.metronomeGroup, options);
    this.cancelGroup(playback.noteGroup, options);
    this.finishPlayback(id, playback);
  }

  cancelPendingStart(id?: string) {
    const ids = id === undefined ? [...this.pending.keys()] : [id];
    let changed = false;

    ids.forEach((pendingId) => {
      if (this.pending.delete(pendingId)) {
        this.nextRevision(pendingId);
        changed = true;
      }
    });

    if (changed) {
      this.emit();
    }
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

  private createClickScheduler({
    group,
    secondsPerBeat,
  }: {
    group: PlaybackGroupHandle;
    secondsPerBeat: number;
  }) {
    return this.createMetronomeScheduler({
      events: [{ duration: secondsPerBeat, offset: 0, payload: true }],
      getCurrentTime: this.audioEngine.getCurrentTime,
      onSchedule: (_event, startTime) => {
        this.audioEngine.scheduleMetronomeClick({
          accent: false,
          group,
          startTime,
        });
      },
    });
  }

  private reconcileMetronome(owner: PlaybackOwner) {
    const candidates = [...this.active.values()].filter(
      (playback) =>
        playback.snapshot.owner === owner && playback.request.metronomeEnabled,
    );
    const provider =
      candidates.find((playback) => playback.metronomeScheduler) ??
      candidates[0];

    this.active.forEach((playback) => {
      if (
        playback.snapshot.owner !== owner ||
        playback === provider ||
        !playback.metronomeScheduler
      ) {
        return;
      }

      playback.metronomeScheduler.stop();
      this.cancelGroup(playback.metronomeGroup);
      delete playback.metronomeGroup;
      delete playback.metronomeScheduler;
    });

    if (!provider || provider.metronomeScheduler) {
      return;
    }

    const group = this.audioEngine.createPlaybackGroup();
    const scheduler = this.createClickScheduler({
      group,
      secondsPerBeat: provider.snapshot.secondsPerBeat,
    });
    provider.metronomeGroup = group;
    provider.metronomeScheduler = scheduler;
    scheduler.start(provider.snapshot.originTime);
  }

  private scheduleCountIn({
    countInBeats,
    countInStartTime,
    group,
    secondsPerBeat,
    currentTime,
  }: {
    countInBeats: ExerciseCountInBeats;
    countInStartTime: number;
    group: PlaybackGroupHandle;
    secondsPerBeat: number;
    currentTime: number;
  }) {
    for (let beatIndex = 0; beatIndex < countInBeats; beatIndex += 1) {
      const startTime = countInStartTime + beatIndex * secondsPerBeat;

      if (startTime < currentTime + AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS) {
        continue;
      }

      this.audioEngine.scheduleMetronomeClick({
        accent: beatIndex === 0,
        group,
        startTime,
      });
    }
  }

  getActiveStepIndex(outputContextTime: number, id?: string) {
    const activePlayback = this.active.get(id ?? this.latestId ?? "");

    if (!activePlayback) {
      return undefined;
    }

    const playback =
      outputContextTime < activePlayback.snapshot.originTime &&
      activePlayback.visualPredecessor
        ? activePlayback.visualPredecessor
        : activePlayback.snapshot;

    if (outputContextTime < playback.originTime) {
      return undefined;
    }

    const positionBeats =
      ((outputContextTime - playback.originTime) / playback.secondsPerBeat) %
      playback.cycleDuration;

    return playback.events.find(
      (event) =>
        positionBeats >= event.offsetBeats &&
        positionBeats < event.offsetBeats + event.durationBeats,
    )?.stepIndex;
  }

  async start(
    request: ExercisePlaybackRequest,
    options: ExercisePlaybackStartOptions = {},
  ) {
    this.cancelPendingStart();
    const revision = this.nextRevision(request.id);
    const owner = options.owner ?? "manual";
    this.pending.set(request.id, {
      originTime: options.originTime,
      owner,
      request,
      revision,
    });
    this.latestId = request.id;
    this.emit();

    const prepared =
      options.prepared === true ? true : await this.audioEngine.prime();
    const currentTime = this.audioEngine.getCurrentTime();

    if (
      !prepared ||
      currentTime === undefined ||
      this.revisions.get(request.id) !== revision
    ) {
      if (this.pending.get(request.id)?.revision === revision) {
        this.pending.delete(request.id);
        this.emit();
      }
      return false;
    }

    const cycleDuration = getCycleDuration(request.events);
    if (request.events.length === 0 || cycleDuration <= 0) {
      this.pending.delete(request.id);
      this.emit();
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const countInStartTime =
      options.originTime === undefined
        ? currentTime + AUDIO_PLAYBACK_START_LEAD_SECONDS
        : options.originTime - request.countInBeats * secondsPerBeat;
    const originTime =
      options.originTime ??
      countInStartTime + request.countInBeats * secondsPerBeat;
    const replacementTime =
      request.countInBeats > 0 ? countInStartTime : originTime;
    const visualPredecessor =
      options.handoff === true && originTime > currentTime
        ? this.active.get(request.id)?.snapshot
        : undefined;
    this.active.forEach((playback, id) => {
      this.stopPlayback(id, playback, {
        ...(replacementTime > currentTime ? { atTime: replacementTime } : {}),
        releaseSeconds: AUDIO_STOP_RELEASE_SECONDS,
      });
    });

    const countInGroup =
      request.countInBeats > 0
        ? this.audioEngine.createPlaybackGroup()
        : undefined;
    const noteGroup = this.audioEngine.createPlaybackGroup();
    const noteScheduler = this.createNoteScheduler({
      group: noteGroup,
      request,
      secondsPerBeat,
    });
    const snapshot: ExercisePlaybackInstanceSnapshot = {
      activeId: request.id,
      countInBeats: request.countInBeats,
      countInStartTime,
      cycleDuration,
      events: request.events,
      originTime,
      owner,
      playing: true,
      secondsPerBeat,
    };
    const playback: ActiveExercisePlayback = {
      ...(countInGroup ? { countInGroup } : {}),
      noteGroup,
      noteScheduler,
      request,
      snapshot,
      ...(visualPredecessor ? { visualPredecessor } : {}),
    };

    if (countInGroup) {
      this.scheduleCountIn({
        countInBeats: request.countInBeats,
        countInStartTime,
        currentTime,
        group: countInGroup,
        secondsPerBeat,
      });
    }
    noteScheduler.start(originTime);
    this.pending.delete(request.id);
    this.active.set(request.id, playback);
    this.reconcileMetronome(owner);
    this.emit();
    return true;
  }

  stop(id?: string, options?: { atTime?: number; releaseSeconds?: number }) {
    const ids = id === undefined ? [...this.active.keys()] : [id];
    this.cancelPendingStart(id);
    ids.forEach((activeId) => {
      const playback = this.active.get(activeId);
      if (playback) {
        this.stopPlayback(activeId, playback, options);
      }
    });
  }

  setMetronomeEnabled(id: string, enabled: boolean) {
    const playback = this.active.get(id);
    if (!playback || playback.request.metronomeEnabled === enabled) {
      return false;
    }

    playback.request = { ...playback.request, metronomeEnabled: enabled };
    this.reconcileMetronome(playback.snapshot.owner);
    return true;
  }
}

export const exercisePlaybackCoordinator = new ExercisePlaybackCoordinator();
