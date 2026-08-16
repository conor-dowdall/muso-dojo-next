import {
  beatTransportCoordinator,
  type BeatTransportCoordinator,
} from "./beatTransportCoordinator";
import {
  AUDIO_PLAYBACK_START_LEAD_SECONDS,
  AUDIO_SCHEDULER_HORIZON_SECONDS,
} from "./audioTimingConfig";
import {
  getPartSequencePartIndex,
  getPartSequencePlaybackPartCount,
  type ArrangementStepContext,
  type PartSequencePlaybackPlan,
  type PartSequenceStartOptions,
  type PlaybackCompletionPolicy,
  type PlaybackSequenceOwner,
} from "./partSequencePlanning";

const PART_SEQUENCE_HANDOFF_LEAD_SECONDS = AUDIO_SCHEDULER_HORIZON_SECONDS;
const PART_SEQUENCE_COMMIT_LEAD_SECONDS = 0.01;
const PART_SEQUENCE_RECOVERY_LEAD_SECONDS =
  AUDIO_PLAYBACK_START_LEAD_SECONDS + PART_SEQUENCE_COMMIT_LEAD_SECONDS;
const BEAT_GRID_EPSILON = 1e-6;

export type PartSequencePendingKind = "handoff" | "restart";

export interface PartSequenceSnapshot {
  activeArrangementContext?: ArrangementStepContext;
  activeIndex?: number;
  activeOccurrence?: number;
  activePartId?: string;
  activeSourcePartId?: string;
  activeStepId?: string;
  completionPolicy?: PlaybackCompletionPolicy;
  contentSignature?: string;
  cycleEndTime?: number;
  originTime?: number;
  partCount: number;
  partResetSignatures?: readonly string[];
  pendingIndex?: number;
  pendingKind?: PartSequencePendingKind;
  pendingPartId?: string;
  pendingArrangementContext?: ArrangementStepContext;
  pendingStepId?: string;
  pendingTempoBpm?: number;
  playing: boolean;
  mode?: PartSequencePlaybackPlan["mode"];
  owner?: PlaybackSequenceOwner;
  sessionId?: string;
  signature?: string;
  sourceSignature?: string;
  tempoBpm?: number;
  tempoSignature?: string;
  updateSignature?: string;
}

export interface PartSequenceStopOptions {
  stopPlayback?: boolean;
}

const idleSnapshot: PartSequenceSnapshot = {
  partCount: 0,
  playing: false,
};

function normalizeTempo(tempoBpm: number) {
  return Math.min(300, Math.max(30, Math.round(tempoBpm)));
}

function getSecondsPerBeat(tempoBpm: number) {
  return 60 / normalizeTempo(tempoBpm);
}

function getNextBeatBoundary({
  currentTime,
  originTime,
  tempoBpm,
}: {
  currentTime: number;
  originTime: number;
  tempoBpm: number;
}) {
  const secondsPerBeat = getSecondsPerBeat(tempoBpm);
  const minimumStartTime = currentTime + AUDIO_PLAYBACK_START_LEAD_SECONDS;
  const elapsedBeats = (minimumStartTime - originTime) / secondsPerBeat;

  return (
    originTime + Math.ceil(elapsedBeats - BEAT_GRID_EPSILON) * secondsPerBeat
  );
}

function getStepDurationSeconds(
  step: PartSequencePlaybackPlan["parts"][number],
) {
  return step.durationBeats * getSecondsPerBeat(step.tempoBpm);
}

function getStepReleaseSeconds(
  step: PartSequencePlaybackPlan["parts"][number],
) {
  const releaseSeconds = step.releaseSeconds;
  return typeof releaseSeconds === "number" &&
    Number.isFinite(releaseSeconds) &&
    releaseSeconds > 0
    ? releaseSeconds
    : 0;
}

function getSequenceDurationSeconds(plan: PartSequencePlaybackPlan) {
  return plan.parts
    .slice(0, getPartSequencePlaybackPartCount(plan))
    .reduce((duration, part) => duration + getStepDurationSeconds(part), 0);
}

function getOccurrenceOffsetSeconds(
  plan: PartSequencePlaybackPlan,
  occurrence: number,
) {
  const partCount = getPartSequencePlaybackPartCount(plan);
  const cycle =
    plan.completionPolicy === "stop-at-end"
      ? 0
      : Math.floor(occurrence / partCount);
  const index = getPartSequencePartIndex(plan, occurrence);
  const cycleDuration = getSequenceDurationSeconds(plan);
  const partOffset = plan.parts
    .slice(0, index)
    .reduce((duration, part) => duration + getStepDurationSeconds(part), 0);

  return cycle * cycleDuration + partOffset;
}

function rhythmContinuesThroughOccurrences({
  fromOccurrence,
  plan,
  toOccurrence,
}: {
  fromOccurrence: number;
  plan: PartSequencePlaybackPlan;
  toOccurrence: number;
}) {
  if (toOccurrence <= fromOccurrence) {
    return true;
  }

  const distance = toOccurrence - fromOccurrence;
  if (
    distance >= getPartSequencePlaybackPartCount(plan) &&
    plan.parts
      .slice(0, getPartSequencePlaybackPartCount(plan))
      .some((part) => !part.continueRhythm)
  ) {
    return false;
  }

  const occurrencesToInspect = Math.min(
    distance,
    getPartSequencePlaybackPartCount(plan),
  );
  for (let offset = 1; offset <= occurrencesToInspect; offset += 1) {
    const part =
      plan.parts[getPartSequencePartIndex(plan, fromOccurrence + offset)];
    if (!part?.continueRhythm) {
      return false;
    }
  }

  return true;
}

export class PartSequenceCoordinator {
  private activeOccurrence: number | undefined;
  private listeners = new Set<() => void>();
  private plan: PartSequencePlaybackPlan | undefined;
  private revision = 0;
  private sequenceOriginTime: number | undefined;
  private snapshot: PartSequenceSnapshot = idleSnapshot;
  private timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  private startCountIn: PartSequenceStartOptions["countIn"] | undefined;

  constructor(
    private readonly transport: BeatTransportCoordinator = beatTransportCoordinator,
  ) {
    this.transport.subscribeToManualControl(() => {
      if (!this.snapshot.playing) {
        return;
      }

      this.stop({ stopPlayback: true });
    });
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private clearTimer() {
    if (this.timer === undefined) {
      return;
    }

    globalThis.clearTimeout(this.timer);
    this.timer = undefined;
  }

  private getTimerDelayMilliseconds(targetTime: number, leadSeconds = 0) {
    const currentTime = this.transport.getCurrentTime();

    return currentTime === undefined
      ? 0
      : Math.max(0, (targetTime - currentTime - leadSeconds) * 1000);
  }

  private getOccurrenceOriginTime(
    plan: PartSequencePlaybackPlan,
    occurrence: number,
  ) {
    return this.sequenceOriginTime === undefined
      ? undefined
      : this.sequenceOriginTime + getOccurrenceOffsetSeconds(plan, occurrence);
  }

  private setSequenceOriginForOccurrence({
    occurrence,
    originTime,
    plan,
  }: {
    occurrence: number;
    originTime: number;
    plan: PartSequencePlaybackPlan;
  }) {
    this.sequenceOriginTime =
      originTime - getOccurrenceOffsetSeconds(plan, occurrence);
  }

  private getNextSchedulableOccurrence({
    minimumOccurrence,
    plan,
  }: {
    minimumOccurrence: number;
    plan: PartSequencePlaybackPlan;
  }) {
    const currentTime = this.transport.getCurrentTime();
    if (currentTime === undefined || this.sequenceOriginTime === undefined) {
      return minimumOccurrence;
    }

    const minimumOriginTime = currentTime + PART_SEQUENCE_RECOVERY_LEAD_SECONDS;
    const sequenceDuration = getSequenceDurationSeconds(plan);
    let occurrence = minimumOccurrence;
    let originTime = this.getOccurrenceOriginTime(plan, occurrence);

    if (
      originTime !== undefined &&
      originTime < minimumOriginTime &&
      sequenceDuration > 0
    ) {
      const elapsedCycles = Math.max(
        0,
        Math.floor(
          (minimumOriginTime - this.sequenceOriginTime) / sequenceDuration,
        ),
      );
      occurrence = Math.max(
        occurrence,
        elapsedCycles * getPartSequencePlaybackPartCount(plan),
      );
      originTime = this.getOccurrenceOriginTime(plan, occurrence);
    }

    while (originTime !== undefined && originTime < minimumOriginTime) {
      occurrence += 1;
      originTime = this.getOccurrenceOriginTime(plan, occurrence);
    }

    const activeOccurrence = this.activeOccurrence;
    if (
      activeOccurrence === undefined ||
      rhythmContinuesThroughOccurrences({
        fromOccurrence: activeOccurrence,
        plan,
        toOccurrence: occurrence,
      })
    ) {
      return occurrence;
    }

    // If recovery crossed a Rhythm reset, do not resume in the middle of its
    // parent bar. The first Part in the sequence is also a stable cycle reset
    // for a Rhythm deliberately continued across the Session wrap.
    while (true) {
      const index = getPartSequencePartIndex(plan, occurrence);
      const part = plan.parts[index];
      if (index === 0 || !part?.continueRhythm) {
        return occurrence;
      }
      occurrence += 1;
    }
  }

  private commitPart({
    occurrence,
    originTime,
    plan,
    resetTimeline = false,
    revision,
  }: {
    occurrence: number;
    originTime?: number;
    plan: PartSequencePlaybackPlan;
    resetTimeline?: boolean;
    revision: number;
  }) {
    if (revision !== this.revision || this.plan !== plan) {
      return;
    }

    const index = getPartSequencePartIndex(plan, occurrence);
    const part = plan.parts[index];

    if (!part) {
      this.stop({ stopPlayback: false });
      return;
    }

    const durationSeconds = getStepDurationSeconds(part);
    const cycleEndTime =
      originTime === undefined
        ? undefined
        : originTime + durationSeconds + getStepReleaseSeconds(part);

    if (
      originTime !== undefined &&
      (resetTimeline || this.sequenceOriginTime === undefined)
    ) {
      this.setSequenceOriginForOccurrence({ occurrence, originTime, plan });
    }
    this.activeOccurrence = occurrence;

    this.snapshot = {
      activeArrangementContext: part.arrangement,
      activeIndex: index,
      activeOccurrence: occurrence,
      activePartId: part.partId,
      activeSourcePartId: part.sourcePartId ?? part.partId,
      activeStepId: part.stepId ?? part.partId,
      completionPolicy: plan.completionPolicy ?? "loop",
      contentSignature: plan.contentSignature,
      ...(cycleEndTime === undefined ? {} : { cycleEndTime }),
      ...(originTime === undefined ? {} : { originTime }),
      partCount: getPartSequencePlaybackPartCount(plan),
      partResetSignatures: plan.partResetSignatures,
      playing: true,
      mode: plan.mode,
      owner: plan.owner ?? { kind: "session", id: plan.sessionId },
      sessionId: plan.sessionId,
      signature: plan.signature,
      sourceSignature: plan.sourceSignature,
      tempoBpm: part.tempoBpm,
      tempoSignature: plan.tempoSignature,
      updateSignature: plan.updateSignature,
    };
    this.emit();
    this.scheduleNextPart({
      occurrence,
      plan,
      revision,
    });
  }

  private scheduleNextPart({
    occurrence,
    plan,
    revision,
  }: {
    occurrence: number;
    plan: PartSequencePlaybackPlan;
    revision: number;
  }) {
    const nextOccurrence = occurrence + 1;
    const nextOriginTime = this.getOccurrenceOriginTime(plan, nextOccurrence);
    if (
      plan.completionPolicy === "stop-at-end" &&
      nextOccurrence >= getPartSequencePlaybackPartCount(plan)
    ) {
      const currentPart = plan.parts[occurrence];
      const durationSeconds = currentPart
        ? getStepDurationSeconds(currentPart)
        : 0;
      const releaseSeconds = currentPart
        ? getStepReleaseSeconds(currentPart)
        : 0;
      const endTime =
        nextOriginTime ??
        (this.snapshot.originTime === undefined
          ? undefined
          : this.snapshot.originTime + durationSeconds);
      if (endTime !== undefined) {
        // Register the finite boundary with the audio engine before the
        // lookahead schedulers can queue a hit on the next downbeat.
        this.transport.stopPartPlayback("part-sequence", {
          atTime: endTime,
          ...(releaseSeconds > 0 ? { releaseSeconds } : {}),
        });
      }
      const completionTime =
        endTime === undefined ? undefined : endTime + releaseSeconds;
      this.clearTimer();
      this.timer = globalThis.setTimeout(
        () => this.stop({ stopPlayback: endTime === undefined }),
        completionTime === undefined
          ? (durationSeconds + releaseSeconds) * 1000
          : this.getTimerDelayMilliseconds(completionTime),
      );
      return;
    }
    const durationSeconds = getStepDurationSeconds(
      plan.parts[getPartSequencePartIndex(plan, occurrence)]!,
    );
    const delayMilliseconds =
      nextOriginTime === undefined
        ? durationSeconds * 1000
        : this.getTimerDelayMilliseconds(
            nextOriginTime,
            PART_SEQUENCE_HANDOFF_LEAD_SECONDS,
          );

    this.clearTimer();
    this.timer = globalThis.setTimeout(() => {
      const scheduledOccurrence = this.getNextSchedulableOccurrence({
        minimumOccurrence: nextOccurrence,
        plan,
      });
      if (
        plan.completionPolicy === "stop-at-end" &&
        scheduledOccurrence >= getPartSequencePlaybackPartCount(plan)
      ) {
        this.stop({ stopPlayback: true });
        return;
      }
      const preserveRhythmPhase = rhythmContinuesThroughOccurrences({
        fromOccurrence: occurrence,
        plan,
        toOccurrence: scheduledOccurrence,
      });
      void this.startPartAtOccurrence({
        forceRhythmRestart: !preserveRhythmPhase,
        handoff: true,
        occurrence: scheduledOccurrence,
        originTime: this.getOccurrenceOriginTime(plan, scheduledOccurrence),
        plan,
        revision,
      });
    }, delayMilliseconds);
  }

  private async startPartAtOccurrence({
    forceRhythmRestart = false,
    handoff,
    occurrence,
    originTime,
    pendingKind,
    plan,
    replacementTime,
    resetTimeline = false,
    revision,
  }: {
    forceRhythmRestart?: boolean;
    handoff: boolean;
    occurrence: number;
    originTime?: number;
    pendingKind?: PartSequencePendingKind;
    plan: PartSequencePlaybackPlan;
    replacementTime?: number;
    resetTimeline?: boolean;
    revision: number;
  }) {
    if (revision !== this.revision || this.plan !== plan) {
      return false;
    }

    const index = getPartSequencePartIndex(plan, occurrence);
    const part = plan.parts[index];

    if (!part) {
      this.stop({ stopPlayback: false });
      return false;
    }

    this.clearTimer();
    const resolvedPendingKind =
      pendingKind ?? (handoff ? "handoff" : undefined);
    this.snapshot = {
      ...this.snapshot,
      completionPolicy: plan.completionPolicy ?? "loop",
      contentSignature: plan.contentSignature,
      partCount: getPartSequencePlaybackPartCount(plan),
      partResetSignatures: plan.partResetSignatures,
      pendingIndex: index,
      ...(resolvedPendingKind === undefined
        ? {}
        : { pendingKind: resolvedPendingKind }),
      pendingPartId: part.partId,
      pendingArrangementContext: part.arrangement,
      pendingStepId: part.stepId ?? part.partId,
      pendingTempoBpm: part.tempoBpm,
      playing: true,
      mode: plan.mode,
      owner: plan.owner ?? { kind: "session", id: plan.sessionId },
      sessionId: plan.sessionId,
      signature: plan.signature,
      sourceSignature: plan.sourceSignature,
      tempoBpm: this.snapshot.tempoBpm ?? part.tempoBpm,
      tempoSignature: plan.tempoSignature,
      updateSignature: plan.updateSignature,
    };
    this.emit();

    const preserveRhythms =
      handoff && part.continueRhythm && !forceRhythmRestart;
    const result = await this.transport.startPart({
      countIn: handoff ? undefined : (this.startCountIn ?? plan.countIn),
      exercises: part.exerciseRequests,
      handoff,
      originTime,
      preserveRhythms,
      replacementTime,
      rhythms: part.rhythmRequests,
      source: "part-sequence",
      stopMissing: true,
      tempoBpm: part.tempoBpm,
    });

    if (revision !== this.revision || this.plan !== plan) {
      return false;
    }

    if (!result.started) {
      this.stop();
      return false;
    }

    const startedOriginTime = result.originTime ?? originTime;
    const currentTime = this.transport.getCurrentTime();
    const shouldCommitLater =
      handoff &&
      startedOriginTime !== undefined &&
      currentTime !== undefined &&
      startedOriginTime > currentTime + PART_SEQUENCE_COMMIT_LEAD_SECONDS;

    if (!shouldCommitLater) {
      this.commitPart({
        occurrence,
        originTime: startedOriginTime,
        plan,
        resetTimeline,
        revision,
      });
      return true;
    }

    this.timer = globalThis.setTimeout(
      () =>
        this.commitPart({
          occurrence,
          originTime: startedOriginTime,
          plan,
          resetTimeline,
          revision,
        }),
      this.getTimerDelayMilliseconds(startedOriginTime),
    );

    return true;
  }

  getSnapshot = () => this.snapshot;

  getClockTime = () => this.transport.getCurrentTime();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async start(
    plan: PartSequencePlaybackPlan,
    options?: Partial<PartSequenceStartOptions>,
  ) {
    this.stop({ stopPlayback: false });

    const playbackPartCount = getPartSequencePlaybackPartCount(plan);
    if (playbackPartCount === 0) {
      return false;
    }

    const revision = ++this.revision;
    this.plan = plan;
    this.startCountIn = options?.countIn ?? plan.countIn;
    const startIndex = Math.min(
      playbackPartCount - 1,
      Math.max(0, Math.round(options?.startIndex ?? 0)),
    );

    return this.startPartAtOccurrence({
      handoff: false,
      occurrence: startIndex,
      plan,
      resetTimeline: true,
      revision,
    });
  }

  async restartCurrentPart(plan: PartSequencePlaybackPlan) {
    const currentIndex = this.snapshot.activeIndex;
    const playbackPartCount = getPartSequencePlaybackPartCount(plan);

    if (!this.snapshot.playing || playbackPartCount === 0) {
      return this.start(plan);
    }

    if (currentIndex === undefined) {
      this.stop();
      return this.start(plan);
    }

    this.clearTimer();
    const revision = ++this.revision;
    this.plan = plan;
    const currentTime = this.transport.getCurrentTime();
    const activeOriginTime = this.snapshot.originTime;
    const committedTempoBpm = this.snapshot.tempoBpm;
    const nextBeatBoundary =
      currentTime === undefined ||
      activeOriginTime === undefined ||
      committedTempoBpm === undefined
        ? undefined
        : getNextBeatBoundary({
            currentTime,
            originTime: activeOriginTime,
            tempoBpm: committedTempoBpm,
          });
    // Content edited during an intro can replace the already-queued Part at
    // its original downbeat without disturbing the count-in.
    const replacementTime =
      nextBeatBoundary !== undefined &&
      activeOriginTime !== undefined &&
      nextBeatBoundary < activeOriginTime
        ? activeOriginTime
        : nextBeatBoundary;

    return this.startPartAtOccurrence({
      forceRhythmRestart: true,
      handoff: true,
      occurrence: Math.min(currentIndex, playbackPartCount - 1),
      originTime: replacementTime,
      pendingKind: "restart",
      plan,
      replacementTime,
      resetTimeline: true,
      revision,
    });
  }

  async retimeCurrentPart(plan: PartSequencePlaybackPlan) {
    const currentIndex = this.snapshot.activeIndex;
    const playbackPartCount = getPartSequencePlaybackPartCount(plan);

    if (!this.snapshot.playing || playbackPartCount === 0) {
      return this.start(plan);
    }

    if (currentIndex === undefined) {
      this.stop();
      return this.start(plan);
    }

    const currentTime = this.transport.getCurrentTime();
    const activeOriginTime = this.snapshot.originTime;
    const committedTempoBpm = this.snapshot.tempoBpm;

    if (
      currentTime === undefined ||
      activeOriginTime === undefined ||
      committedTempoBpm === undefined
    ) {
      return this.restartCurrentPart(plan);
    }

    const replacementTime = getNextBeatBoundary({
      currentTime,
      originTime: activeOriginTime,
      tempoBpm: committedTempoBpm,
    });
    const countIn = this.startCountIn ?? plan.countIn;
    const shouldRestartCountIn =
      replacementTime < activeOriginTime &&
      countIn.durationBeats > 0 &&
      countIn.pulses > 0;
    const originTime = shouldRestartCountIn
      ? replacementTime +
        countIn.durationBeats *
          getSecondsPerBeat(
            plan.parts[Math.min(currentIndex, playbackPartCount - 1)]!.tempoBpm,
          )
      : replacementTime;

    this.clearTimer();
    const revision = ++this.revision;
    this.plan = plan;

    return this.startPartAtOccurrence({
      forceRhythmRestart: true,
      handoff: !shouldRestartCountIn,
      occurrence: Math.min(currentIndex, playbackPartCount - 1),
      originTime,
      pendingKind: "restart",
      plan,
      replacementTime,
      resetTimeline: true,
      revision,
    });
  }

  updatePlan(plan: PartSequencePlaybackPlan) {
    const currentIndex = this.snapshot.activeIndex;
    const originTime = this.snapshot.originTime;
    const previousPlan = this.plan;
    const playbackPartCount = getPartSequencePlaybackPartCount(plan);

    if (
      !this.snapshot.playing ||
      currentIndex === undefined ||
      originTime === undefined ||
      playbackPartCount === 0
    ) {
      return false;
    }

    const part = plan.parts[currentIndex];

    if (!part) {
      this.stop({ stopPlayback: false });
      return false;
    }

    this.clearTimer();
    const revision = ++this.revision;
    this.plan = plan;
    const durationSeconds = getStepDurationSeconds(part);
    const cycleEndTime =
      originTime + durationSeconds + getStepReleaseSeconds(part);
    const activePartIsExcludedFromLoop = currentIndex >= playbackPartCount;

    if (activePartIsExcludedFromLoop) {
      // A completion-only step is already audible. Let it resolve musically,
      // then establish a fresh loop timeline at the first ordinary step.
      this.activeOccurrence = undefined;
      this.snapshot = {
        ...this.snapshot,
        activeOccurrence: undefined,
        completionPolicy: plan.completionPolicy ?? "loop",
        contentSignature: plan.contentSignature,
        cycleEndTime,
        partCount: playbackPartCount,
        partResetSignatures: plan.partResetSignatures,
        signature: plan.signature,
        sourceSignature: plan.sourceSignature,
        tempoSignature: plan.tempoSignature,
        updateSignature: plan.updateSignature,
      };
      this.emit();
      this.timer = globalThis.setTimeout(
        () => {
          void this.startPartAtOccurrence({
            forceRhythmRestart: true,
            handoff: true,
            occurrence: 0,
            originTime: cycleEndTime,
            plan,
            resetTimeline: true,
            revision,
          });
        },
        this.getTimerDelayMilliseconds(
          cycleEndTime,
          PART_SEQUENCE_HANDOFF_LEAD_SECONDS,
        ),
      );
      return true;
    }

    const occurrence =
      plan.completionPolicy === "stop-at-end"
        ? currentIndex
        : (this.activeOccurrence ?? currentIndex);
    this.activeOccurrence = occurrence;
    this.setSequenceOriginForOccurrence({ occurrence, originTime, plan });
    const previousPart = previousPlan?.parts[currentIndex];
    if (
      !previousPart ||
      previousPart.partId !== part.partId ||
      previousPart.updateSignature !== part.updateSignature
    ) {
      this.transport.updatePartLive({
        exercises: part.exerciseRequests,
        rhythms: part.rhythmRequests,
      });
    }

    this.snapshot = {
      ...this.snapshot,
      activeArrangementContext: part.arrangement,
      activeIndex: currentIndex,
      activeOccurrence: occurrence,
      activePartId: part.partId,
      activeSourcePartId: part.sourcePartId ?? part.partId,
      activeStepId: part.stepId ?? part.partId,
      completionPolicy: plan.completionPolicy ?? "loop",
      contentSignature: plan.contentSignature,
      cycleEndTime,
      originTime,
      partCount: playbackPartCount,
      partResetSignatures: plan.partResetSignatures,
      playing: true,
      mode: plan.mode,
      owner: plan.owner ?? { kind: "session", id: plan.sessionId },
      sessionId: plan.sessionId,
      signature: plan.signature,
      sourceSignature: plan.sourceSignature,
      tempoBpm: part.tempoBpm,
      tempoSignature: plan.tempoSignature,
      updateSignature: plan.updateSignature,
    };
    this.emit();
    this.scheduleNextPart({
      occurrence,
      plan,
      revision,
    });
    return true;
  }

  stop({ stopPlayback = true }: PartSequenceStopOptions = {}) {
    this.clearTimer();
    this.activeOccurrence = undefined;
    this.plan = undefined;
    this.revision += 1;
    this.sequenceOriginTime = undefined;
    this.startCountIn = undefined;
    this.snapshot = idleSnapshot;
    this.emit();

    if (stopPlayback) {
      this.transport.stopPartPlayback();
    }
  }
}

export const partSequenceCoordinator = new PartSequenceCoordinator();
