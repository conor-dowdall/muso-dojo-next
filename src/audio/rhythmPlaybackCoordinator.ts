import {
  RHYTHM_PPQ,
  type RhythmHit,
  type RhythmPattern,
} from "@/data/rhythmPresets";
import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
import { AUDIO_PLAYBACK_START_LEAD_SECONDS } from "./audioTimingConfig";
import { musoAudioEngine } from "./createWebAudioEngine";
import { type PlaybackOwner } from "./playbackOwnership";
import { type AudioEngine, type PlaybackGroupHandle } from "./types";

const DEFAULT_RHYTHM_HIT_VELOCITY = 0.72;
const RHYTHM_PLAYBACK_GAIN = 1.18;

export interface RhythmPlaybackRequest {
  id: string;
  pattern: RhythmPattern;
  tempoBpm: number;
}

export interface RhythmPlaybackInstanceSnapshot {
  activeId: string;
  cycleDuration: number;
  originTime: number;
  owner: PlaybackOwner;
  playing: true;
  tempoBpm: number;
}

export interface RhythmPlaybackSnapshot {
  activeId?: string;
  cycleDuration?: number;
  originTime?: number;
  owner?: PlaybackOwner;
  pendingId?: string;
  pendingIds: readonly string[];
  pendingOwners?: Readonly<Record<string, PlaybackOwner>>;
  pendingOwner?: PlaybackOwner;
  pendingOriginTime?: number;
  playbacks: Readonly<Record<string, RhythmPlaybackInstanceSnapshot>>;
  playing: boolean;
  tempoBpm?: number;
}

export interface RhythmPlaybackStartOptions {
  handoff?: boolean;
  originTime?: number;
  owner?: PlaybackOwner;
  prepared?: boolean;
}

interface RhythmSchedulerHit extends RhythmHit {
  scheduledTicks: number;
}

interface ActiveRhythmPlayback {
  group: PlaybackGroupHandle;
  request: RhythmPlaybackRequest;
  scheduler: LookaheadScheduler;
  snapshot: RhythmPlaybackInstanceSnapshot;
  stopTimer?: ReturnType<typeof globalThis.setTimeout>;
}

interface PendingRhythmStart {
  originTime?: number;
  owner: PlaybackOwner;
  request: RhythmPlaybackRequest;
  revision: number;
}

export type RhythmPlaybackAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "schedulePercussionHit"
  | "subscribeToStopAll"
> &
  Partial<Pick<AudioEngine, "clearPlaybackGroupCancellation">>;

export type RhythmSchedulerFactory = (
  options: LookaheadSchedulerOptions<RhythmSchedulerHit>,
) => LookaheadScheduler;

const idleSnapshot: RhythmPlaybackSnapshot = {
  pendingIds: [],
  playbacks: {},
  playing: false,
};

function normalizeTempo(tempoBpm: number) {
  return Math.min(300, Math.max(30, Math.round(tempoBpm)));
}

function getCycleDurationSeconds(
  pattern: RhythmPattern,
  secondsPerBeat: number,
) {
  return (pattern.cycleTicks / pattern.ppq) * secondsPerBeat;
}

function applySwing(atTicks: number, pattern: RhythmPattern) {
  const swing = pattern.swing;
  if (!swing) {
    return atTicks;
  }

  const pairTicks = swing.unitTicks * 2;
  const positionInPair = atTicks % pairTicks;
  return positionInPair === swing.unitTicks
    ? atTicks + pairTicks * swing.ratio - swing.unitTicks
    : atTicks;
}

function toSchedulerEvents(
  pattern: RhythmPattern,
  secondsPerBeat: number,
): LookaheadSchedulerEvent<RhythmSchedulerHit>[] {
  const cycleDurationSeconds = getCycleDurationSeconds(pattern, secondsPerBeat);

  return pattern.hits
    .map((hit) => {
      const scheduledTicks = applySwing(hit.atTicks, pattern);
      const offset = (scheduledTicks / pattern.ppq) * secondsPerBeat;

      return {
        duration: Math.max(0.001, cycleDurationSeconds - offset),
        offset,
        payload: { ...hit, scheduledTicks },
      };
    })
    .sort((left, right) =>
      left.offset !== right.offset
        ? left.offset - right.offset
        : left.payload.sampleId.localeCompare(right.payload.sampleId),
    );
}

function rhythmPatternCanPlay(pattern: RhythmPattern) {
  return (
    pattern.ppq === RHYTHM_PPQ &&
    pattern.hits.length > 0 &&
    pattern.cycleTicks > 0
  );
}

function getRhythmPlaybackVelocity(velocity?: number) {
  return (velocity ?? DEFAULT_RHYTHM_HIT_VELOCITY) * RHYTHM_PLAYBACK_GAIN;
}

export function isRhythmPlaybackActive(
  snapshot: RhythmPlaybackSnapshot,
  id: string,
) {
  return (
    snapshot.playbacks[id] !== undefined || snapshot.pendingIds.includes(id)
  );
}

export function getRhythmPlaybackOwner(
  snapshot: RhythmPlaybackSnapshot,
  id: string,
) {
  return (
    snapshot.playbacks[id]?.owner ??
    snapshot.pendingOwners?.[id] ??
    (snapshot.pendingId === id ? snapshot.pendingOwner : undefined)
  );
}

export class RhythmPlaybackCoordinator {
  private active = new Map<string, ActiveRhythmPlayback>();
  private listeners = new Set<() => void>();
  private pending = new Map<string, PendingRhythmStart>();
  private revisions = new Map<string, number>();
  private snapshot: RhythmPlaybackSnapshot = idleSnapshot;
  private latestId: string | undefined;

  constructor(
    private readonly audioEngine: RhythmPlaybackAudioEngine = musoAudioEngine,
    private readonly createScheduler: RhythmSchedulerFactory = createLookaheadScheduler,
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
      playback.scheduler.stop();
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

  private finishPlayback(id: string, playback: ActiveRhythmPlayback) {
    playback.scheduler.stop();

    if (this.active.get(id) !== playback) {
      return;
    }

    this.active.delete(id);
    if (this.latestId === id) {
      this.latestId = [...this.active.keys()].at(-1);
    }
    this.emit();
  }

  private stopPlayback(
    id: string,
    playback: ActiveRhythmPlayback,
    atTime?: number,
  ) {
    if (playback.stopTimer) {
      globalThis.clearTimeout(playback.stopTimer);
      playback.stopTimer = undefined;
    }

    if (atTime !== undefined) {
      this.audioEngine.cancelPlaybackGroup(playback.group, { atTime });
      const currentTime = this.audioEngine.getCurrentTime();
      if (currentTime !== undefined && atTime > currentTime) {
        playback.stopTimer = globalThis.setTimeout(
          () => this.finishPlayback(id, playback),
          Math.max(0, (atTime - currentTime) * 1000),
        );
        return;
      }
    }

    this.audioEngine.cancelPlaybackGroup(playback.group);
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

  private createHitScheduler({
    group,
    request,
    secondsPerBeat,
  }: {
    group: PlaybackGroupHandle;
    request: RhythmPlaybackRequest;
    secondsPerBeat: number;
  }) {
    return this.createScheduler({
      events: toSchedulerEvents(request.pattern, secondsPerBeat),
      getCurrentTime: this.audioEngine.getCurrentTime,
      onSchedule: (scheduledEvent, startTime) => {
        this.audioEngine.schedulePercussionHit({
          group,
          sampleId: scheduledEvent.payload.sampleId,
          startTime,
          velocity: getRhythmPlaybackVelocity(scheduledEvent.payload.velocity),
        });
      },
    });
  }

  async start(
    request: RhythmPlaybackRequest,
    options: RhythmPlaybackStartOptions = {},
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

    if (!rhythmPatternCanPlay(request.pattern)) {
      this.pending.delete(request.id);
      this.emit();
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const originTime =
      options.originTime ?? currentTime + AUDIO_PLAYBACK_START_LEAD_SECONDS;
    this.active.forEach((playback, id) =>
      this.stopPlayback(
        id,
        playback,
        originTime > currentTime ? originTime : undefined,
      ),
    );

    const group = this.audioEngine.createPlaybackGroup();
    const scheduler = this.createHitScheduler({
      group,
      request,
      secondsPerBeat,
    });
    const snapshot: RhythmPlaybackInstanceSnapshot = {
      activeId: request.id,
      cycleDuration: getCycleDurationSeconds(request.pattern, secondsPerBeat),
      originTime,
      owner,
      playing: true,
      tempoBpm: normalizeTempo(request.tempoBpm),
    };
    const playback: ActiveRhythmPlayback = {
      group,
      request,
      scheduler,
      snapshot,
    };

    scheduler.start(originTime);
    this.pending.delete(request.id);
    this.active.set(request.id, playback);
    this.emit();
    return true;
  }

  stop(id?: string, options?: { atTime?: number }) {
    const ids = id === undefined ? [...this.active.keys()] : [id];
    this.cancelPendingStart(id);
    ids.forEach((activeId) => {
      const playback = this.active.get(activeId);
      if (playback) {
        this.stopPlayback(activeId, playback, options?.atTime);
      }
    });
  }

  setPattern(id: string, pattern: RhythmPattern) {
    const playback = this.active.get(id);
    if (!playback || playback.request.pattern === pattern) {
      return false;
    }

    const request = { ...playback.request, pattern };
    void this.start(request, {
      handoff: true,
      originTime: playback.snapshot.originTime,
      owner: playback.snapshot.owner,
    });
    return true;
  }
}

export const rhythmPlaybackCoordinator = new RhythmPlaybackCoordinator();
