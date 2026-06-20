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
import { musoAudioEngine } from "./createWebAudioEngine";
import { type AudioEngine, type PlaybackGroupHandle } from "./types";

const START_LOOKAHEAD_SECONDS = 0.08;

export interface RhythmPlaybackRequest {
  id: string;
  pattern: RhythmPattern;
  tempoBpm: number;
}

export interface RhythmPlaybackSnapshot {
  activeId?: string;
  cycleDuration?: number;
  originTime?: number;
  pendingId?: string;
  playing: boolean;
  tempoBpm?: number;
}

interface RhythmSchedulerHit extends RhythmHit {
  scheduledTicks: number;
}

interface ActiveRhythmPlayback {
  group: PlaybackGroupHandle;
  request: RhythmPlaybackRequest;
  scheduler: LookaheadScheduler;
  snapshot: RhythmPlaybackSnapshot;
}

export type RhythmPlaybackAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "schedulePercussionHit"
  | "subscribeToStopAll"
>;

export type RhythmSchedulerFactory = (
  options: LookaheadSchedulerOptions<RhythmSchedulerHit>,
) => LookaheadScheduler;

const idleSnapshot: RhythmPlaybackSnapshot = {
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

  if (positionInPair !== swing.unitTicks) {
    return atTicks;
  }

  return atTicks + pairTicks * swing.ratio - swing.unitTicks;
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
        payload: {
          ...hit,
          scheduledTicks,
        },
      };
    })
    .sort((left, right) => {
      if (left.offset !== right.offset) {
        return left.offset - right.offset;
      }

      return left.payload.sampleId.localeCompare(right.payload.sampleId);
    });
}

function rhythmPlaybackRestartRequestsAreEqual(
  left: RhythmPlaybackRequest,
  right: RhythmPlaybackRequest,
) {
  return (
    left.id === right.id &&
    normalizeTempo(left.tempoBpm) === normalizeTempo(right.tempoBpm) &&
    left.pattern === right.pattern
  );
}

function withoutPendingStart(
  snapshot: RhythmPlaybackSnapshot,
): RhythmPlaybackSnapshot {
  const nextSnapshot = { ...snapshot };
  delete nextSnapshot.pendingId;
  return nextSnapshot;
}

export function isRhythmPlaybackActive(
  snapshot: RhythmPlaybackSnapshot,
  id: string,
) {
  return (
    snapshot.pendingId === id || (snapshot.playing && snapshot.activeId === id)
  );
}

export class RhythmPlaybackCoordinator {
  private active: ActiveRhythmPlayback | undefined;
  private listeners = new Set<() => void>();
  private pendingStartId: string | undefined;
  private snapshot: RhythmPlaybackSnapshot = idleSnapshot;
  private startRevision = 0;

  constructor(
    private readonly audioEngine: RhythmPlaybackAudioEngine = musoAudioEngine,
    private readonly createScheduler: RhythmSchedulerFactory = createLookaheadScheduler,
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

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private stopActivePlayback(active: ActiveRhythmPlayback) {
    active.scheduler.stop();
    this.audioEngine.cancelPlaybackGroup(active.group);
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
          velocity: scheduledEvent.payload.velocity,
        });
      },
    });
  }

  async start(request: RhythmPlaybackRequest) {
    if (
      this.active &&
      rhythmPlaybackRestartRequestsAreEqual(this.active.request, request)
    ) {
      return true;
    }

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

    if (
      request.pattern.ppq !== RHYTHM_PPQ ||
      request.pattern.hits.length === 0 ||
      request.pattern.cycleTicks <= 0
    ) {
      this.pendingStartId = undefined;
      this.snapshot = withoutPendingStart(this.snapshot);
      this.emit();
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const originTime = currentTime + START_LOOKAHEAD_SECONDS;
    const cycleDuration = getCycleDurationSeconds(
      request.pattern,
      secondsPerBeat,
    );
    const previous = this.active;

    if (previous) {
      this.stopActivePlayback(previous);
    }

    const group = this.audioEngine.createPlaybackGroup();
    const scheduler = this.createHitScheduler({
      group,
      request,
      secondsPerBeat,
    });
    const snapshot: RhythmPlaybackSnapshot = {
      activeId: request.id,
      cycleDuration,
      originTime,
      playing: true,
      tempoBpm: normalizeTempo(request.tempoBpm),
    };

    this.active = {
      group,
      request,
      scheduler,
      snapshot,
    };
    this.pendingStartId = undefined;
    this.snapshot = snapshot;
    scheduler.start(originTime);
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
      this.stopActivePlayback(this.active);
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

export const rhythmPlaybackCoordinator = new RhythmPlaybackCoordinator();
