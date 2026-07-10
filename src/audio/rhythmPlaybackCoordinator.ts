import {
  RHYTHM_PPQ,
  type RhythmHit,
  type RhythmPattern,
} from "@/data/rhythmPresets";
import { AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS } from "./audioTimingConfig";
import {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
import { musoAudioEngine } from "./createWebAudioEngine";
import { type PlaybackOwner } from "./playbackOwnership";
import { type AudioEngine, type PlaybackGroupHandle } from "./types";

const START_LOOKAHEAD_SECONDS = 0.08;
const HANDOFF_COMMIT_LEAD_SECONDS = AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS;
const DEFAULT_RHYTHM_HIT_VELOCITY = 0.72;
const RHYTHM_PLAYBACK_GAIN = 1.18;

export interface RhythmPlaybackRequest {
  id: string;
  pattern: RhythmPattern;
  tempoBpm: number;
}

export interface RhythmPlaybackSnapshot {
  activeId?: string;
  cycleDuration?: number;
  originTime?: number;
  owner?: PlaybackOwner;
  pendingId?: string;
  pendingOwner?: PlaybackOwner;
  pendingOriginTime?: number;
  playing: boolean;
  tempoBpm?: number;
}

export interface RhythmPlaybackStartOptions {
  handoff?: boolean;
  originTime?: number;
  owner?: PlaybackOwner;
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

interface PendingRhythmHandoff {
  playback: ActiveRhythmPlayback;
  revision: number;
  snapshot: RhythmPlaybackSnapshot;
  timer: ReturnType<typeof globalThis.setTimeout>;
}

interface PendingRhythmStop {
  active: ActiveRhythmPlayback;
  timer: ReturnType<typeof globalThis.setTimeout>;
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

function withoutPendingStart(
  snapshot: RhythmPlaybackSnapshot,
): RhythmPlaybackSnapshot {
  const nextSnapshot = { ...snapshot };
  delete nextSnapshot.pendingId;
  delete nextSnapshot.pendingOwner;
  delete nextSnapshot.pendingOriginTime;
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

export function getRhythmPlaybackOwner(
  snapshot: RhythmPlaybackSnapshot,
  id: string,
) {
  if (snapshot.pendingId === id) {
    return snapshot.pendingOwner;
  }

  return snapshot.playing && snapshot.activeId === id
    ? snapshot.owner
    : undefined;
}

export class RhythmPlaybackCoordinator {
  private active: ActiveRhythmPlayback | undefined;
  private listeners = new Set<() => void>();
  private pendingHandoff: PendingRhythmHandoff | undefined;
  private pendingStop: PendingRhythmStop | undefined;
  private pendingStartId: string | undefined;
  private pendingStartOwner: PlaybackOwner | undefined;
  private pendingStartRequest: RhythmPlaybackRequest | undefined;
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

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private cancelPendingStopTimer() {
    if (!this.pendingStop) {
      return;
    }

    globalThis.clearTimeout(this.pendingStop.timer);
    this.pendingStop = undefined;
  }

  private commitPendingStop(active: ActiveRhythmPlayback) {
    if (this.pendingStop?.active !== active) {
      return;
    }

    this.pendingStop = undefined;

    if (this.active !== active) {
      return;
    }

    active.scheduler.stop();
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
    active: ActiveRhythmPlayback,
    options: { atTime: number },
  ) {
    const currentTime = this.audioEngine.getCurrentTime();

    if (
      currentTime === undefined ||
      options.atTime <= currentTime + HANDOFF_COMMIT_LEAD_SECONDS
    ) {
      this.stopActivePlayback(active);
      return;
    }

    this.cancelPendingStopTimer();
    this.audioEngine.cancelPlaybackGroup(active.group, options);

    this.pendingStop = {
      active,
      timer: globalThis.setTimeout(
        () => this.commitPendingStop(active),
        Math.max(0, (options.atTime - currentTime) * 1000),
      ),
    };
  }

  private stopActivePlayback(
    active: ActiveRhythmPlayback,
    options?: { atTime?: number },
  ) {
    if (options?.atTime !== undefined) {
      this.scheduleActivePlaybackStop(active, {
        atTime: options.atTime,
      });
      return;
    }

    this.cancelPendingStopTimer();
    active.scheduler.stop();
    this.audioEngine.cancelPlaybackGroup(active.group);
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
      this.active.scheduler.stop();
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
    if (
      options.originTime === undefined &&
      this.active &&
      rhythmPlaybackRestartRequestsAreEqual(this.active.request, request)
    ) {
      const owner = options.owner ?? "manual";
      if (this.active.snapshot.owner !== owner) {
        this.active.snapshot = {
          ...this.active.snapshot,
          owner,
        };
        this.snapshot = this.active.snapshot;
        this.emit();
      }
      return true;
    }

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

    if (!rhythmPatternCanPlay(request.pattern)) {
      this.pendingStartId = undefined;
      this.pendingStartOwner = undefined;
      this.pendingStartRequest = undefined;
      this.snapshot = withoutPendingStart(this.snapshot);
      this.emit();
      return false;
    }

    const secondsPerBeat = 60 / normalizeTempo(request.tempoBpm);
    const originTime =
      options.originTime ?? currentTime + START_LOOKAHEAD_SECONDS;
    const cycleDuration = getCycleDurationSeconds(
      request.pattern,
      secondsPerBeat,
    );
    const previous = this.active;

    const shouldHandoff =
      options.handoff === true &&
      previous !== undefined &&
      originTime > currentTime + HANDOFF_COMMIT_LEAD_SECONDS;

    if (previous && !shouldHandoff) {
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
      owner: options.owner ?? "manual",
      playing: true,
      tempoBpm: normalizeTempo(request.tempoBpm),
    };

    const nextActive = {
      group,
      request,
      scheduler,
      snapshot,
    };
    scheduler.start(originTime);
    if (shouldHandoff) {
      // Schedule the audible boundary on the audio clock now. The timer below
      // is deliberately limited to state ownership and may run late on a busy
      // or low-powered device without allowing both Parts to sound together.
      this.audioEngine.cancelPlaybackGroup(previous.group, {
        atTime: originTime,
      });
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

  setPattern(id: string, pattern: RhythmPattern) {
    const active = this.active;

    if (!active || active.snapshot.activeId !== id) {
      return false;
    }

    if (active.request.pattern === pattern) {
      return true;
    }

    if (!rhythmPatternCanPlay(pattern)) {
      return false;
    }

    const { originTime } = active.snapshot;

    if (originTime === undefined) {
      return false;
    }

    const tempoBpm = normalizeTempo(active.request.tempoBpm);
    const secondsPerBeat = 60 / tempoBpm;
    const nextRequest = {
      ...active.request,
      pattern,
      tempoBpm,
    };
    const nextGroup = this.audioEngine.createPlaybackGroup();
    const nextScheduler = this.createHitScheduler({
      group: nextGroup,
      request: nextRequest,
      secondsPerBeat,
    });

    active.scheduler.stop();
    this.audioEngine.cancelPlaybackGroup(active.group);
    active.group = nextGroup;
    active.scheduler = nextScheduler;
    active.request = nextRequest;
    active.snapshot = {
      ...active.snapshot,
      cycleDuration: getCycleDurationSeconds(pattern, secondsPerBeat),
      tempoBpm,
    };
    this.snapshot = active.snapshot;
    nextScheduler.start(originTime);
    this.emit();
    return true;
  }

  stop(id?: string, options?: { atTime?: number }) {
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
      this.stopActivePlayback(this.active, options);
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

export const rhythmPlaybackCoordinator = new RhythmPlaybackCoordinator();
