import {
  beatTransportCoordinator,
  type BeatTransportCoordinator,
} from "./beatTransportCoordinator";
import {
  AUDIO_PLAYBACK_START_LEAD_SECONDS,
  AUDIO_SCHEDULER_HORIZON_SECONDS,
} from "./audioTimingConfig";
import { type PartSequencePlaybackPlan } from "./partSequencePlanning";

const PART_SEQUENCE_HANDOFF_LEAD_SECONDS = AUDIO_SCHEDULER_HORIZON_SECONDS;
const PART_SEQUENCE_COMMIT_LEAD_SECONDS = 0.01;
const PART_SEQUENCE_RECOVERY_LEAD_SECONDS =
  AUDIO_PLAYBACK_START_LEAD_SECONDS + PART_SEQUENCE_COMMIT_LEAD_SECONDS;

export interface PartSequenceSnapshot {
  activeIndex?: number;
  activePartId?: string;
  contentSignature?: string;
  cycleEndTime?: number;
  originTime?: number;
  partCount: number;
  partResetSignatures?: readonly string[];
  pendingIndex?: number;
  pendingPartId?: string;
  playing: boolean;
  mode?: PartSequencePlaybackPlan["mode"];
  sessionId?: string;
  signature?: string;
  sourceSignature?: string;
  tempoBpm?: number;
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

function getPartIndex(plan: PartSequencePlaybackPlan, occurrence: number) {
  return occurrence % plan.parts.length;
}

function getSequenceDurationSeconds(plan: PartSequencePlaybackPlan) {
  const secondsPerBeat = getSecondsPerBeat(plan.tempoBpm);
  return plan.parts.reduce(
    (duration, part) => duration + part.durationBeats * secondsPerBeat,
    0,
  );
}

function getOccurrenceOffsetSeconds(
  plan: PartSequencePlaybackPlan,
  occurrence: number,
) {
  const partCount = plan.parts.length;
  const cycle = Math.floor(occurrence / partCount);
  const index = getPartIndex(plan, occurrence);
  const secondsPerBeat = getSecondsPerBeat(plan.tempoBpm);
  const cycleDuration = getSequenceDurationSeconds(plan);
  const partOffset = plan.parts
    .slice(0, index)
    .reduce(
      (duration, part) => duration + part.durationBeats * secondsPerBeat,
      0,
    );

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
    distance >= plan.parts.length &&
    plan.parts.some((part) => !part.continueRhythm)
  ) {
    return false;
  }

  const occurrencesToInspect = Math.min(distance, plan.parts.length);
  for (let offset = 1; offset <= occurrencesToInspect; offset += 1) {
    const part = plan.parts[getPartIndex(plan, fromOccurrence + offset)];
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
      occurrence = Math.max(occurrence, elapsedCycles * plan.parts.length);
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
      const index = getPartIndex(plan, occurrence);
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

    const index = getPartIndex(plan, occurrence);
    const part = plan.parts[index];

    if (!part) {
      this.stop({ stopPlayback: false });
      return;
    }

    const durationSeconds =
      part.durationBeats * getSecondsPerBeat(plan.tempoBpm);
    const cycleEndTime =
      originTime === undefined ? undefined : originTime + durationSeconds;

    if (
      originTime !== undefined &&
      (resetTimeline || this.sequenceOriginTime === undefined)
    ) {
      this.setSequenceOriginForOccurrence({ occurrence, originTime, plan });
    }
    this.activeOccurrence = occurrence;

    this.snapshot = {
      activeIndex: index,
      activePartId: part.partId,
      contentSignature: plan.contentSignature,
      ...(cycleEndTime === undefined ? {} : { cycleEndTime }),
      ...(originTime === undefined ? {} : { originTime }),
      partCount: plan.parts.length,
      partResetSignatures: plan.partResetSignatures,
      playing: true,
      mode: plan.mode,
      sessionId: plan.sessionId,
      signature: plan.signature,
      sourceSignature: plan.sourceSignature,
      tempoBpm: plan.tempoBpm,
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
    const durationSeconds =
      plan.parts[getPartIndex(plan, occurrence)]!.durationBeats *
      getSecondsPerBeat(plan.tempoBpm);
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
    plan,
    resetTimeline = false,
    revision,
  }: {
    forceRhythmRestart?: boolean;
    handoff: boolean;
    occurrence: number;
    originTime?: number;
    plan: PartSequencePlaybackPlan;
    resetTimeline?: boolean;
    revision: number;
  }) {
    if (revision !== this.revision || this.plan !== plan) {
      return false;
    }

    const index = getPartIndex(plan, occurrence);
    const part = plan.parts[index];

    if (!part) {
      this.stop({ stopPlayback: false });
      return false;
    }

    this.clearTimer();
    this.snapshot = {
      ...this.snapshot,
      contentSignature: plan.contentSignature,
      partCount: plan.parts.length,
      partResetSignatures: plan.partResetSignatures,
      pendingIndex: index,
      pendingPartId: part.partId,
      playing: true,
      mode: plan.mode,
      sessionId: plan.sessionId,
      signature: plan.signature,
      sourceSignature: plan.sourceSignature,
      tempoBpm: plan.tempoBpm,
      updateSignature: plan.updateSignature,
    };
    this.emit();

    const preserveRhythms =
      handoff && part.continueRhythm && !forceRhythmRestart;
    const result = await this.transport.startPart({
      countIn: handoff ? undefined : plan.countIn,
      exercises: part.exerciseRequests,
      handoff,
      originTime,
      preserveRhythms,
      rhythms: part.rhythmRequests,
      source: "part-sequence",
      stopMissing: true,
      tempoBpm: plan.tempoBpm,
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

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async start(plan: PartSequencePlaybackPlan) {
    this.stop({ stopPlayback: false });

    if (plan.parts.length === 0) {
      return false;
    }

    const revision = ++this.revision;
    this.plan = plan;

    return this.startPartAtOccurrence({
      handoff: false,
      occurrence: 0,
      plan,
      resetTimeline: true,
      revision,
    });
  }

  async restartCurrentPart(plan: PartSequencePlaybackPlan) {
    const currentIndex = this.snapshot.activeIndex;

    if (!this.snapshot.playing || plan.parts.length === 0) {
      return this.start(plan);
    }

    if (currentIndex === undefined) {
      this.stop();
      return this.start(plan);
    }

    this.clearTimer();
    const revision = ++this.revision;
    this.plan = plan;

    return this.startPartAtOccurrence({
      forceRhythmRestart: true,
      handoff: true,
      occurrence: Math.min(currentIndex, plan.parts.length - 1),
      plan,
      resetTimeline: true,
      revision,
    });
  }

  updatePlan(plan: PartSequencePlaybackPlan) {
    const currentIndex = this.snapshot.activeIndex;
    const originTime = this.snapshot.originTime;

    if (
      !this.snapshot.playing ||
      currentIndex === undefined ||
      originTime === undefined ||
      plan.parts.length === 0
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
    const occurrence = currentIndex;
    this.activeOccurrence = occurrence;
    this.setSequenceOriginForOccurrence({ occurrence, originTime, plan });
    this.transport.updatePartLive({
      exercises: part.exerciseRequests,
      rhythms: part.rhythmRequests,
    });

    const durationSeconds =
      part.durationBeats * getSecondsPerBeat(plan.tempoBpm);
    const cycleEndTime = originTime + durationSeconds;

    this.snapshot = {
      ...this.snapshot,
      activeIndex: currentIndex,
      activePartId: part.partId,
      contentSignature: plan.contentSignature,
      cycleEndTime,
      originTime,
      partCount: plan.parts.length,
      partResetSignatures: plan.partResetSignatures,
      playing: true,
      mode: plan.mode,
      sessionId: plan.sessionId,
      signature: plan.signature,
      sourceSignature: plan.sourceSignature,
      tempoBpm: plan.tempoBpm,
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
    this.snapshot = idleSnapshot;
    this.emit();

    if (stopPlayback) {
      this.transport.stopPartPlayback();
    }
  }
}

export const partSequenceCoordinator = new PartSequenceCoordinator();
