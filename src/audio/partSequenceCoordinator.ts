import {
  beatTransportCoordinator,
  type BeatTransportCoordinator,
} from "./beatTransportCoordinator";
import { type PartSequencePlaybackPlan } from "./partSequencePlanning";

const PART_SEQUENCE_HANDOFF_LEAD_SECONDS = 0.35;
const PART_SEQUENCE_COMMIT_LEAD_SECONDS = 0.01;

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

export class PartSequenceCoordinator {
  private listeners = new Set<() => void>();
  private plan: PartSequencePlaybackPlan | undefined;
  private revision = 0;
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

  private commitPart({
    index,
    originTime,
    plan,
    revision,
  }: {
    index: number;
    originTime?: number;
    plan: PartSequencePlaybackPlan;
    revision: number;
  }) {
    if (revision !== this.revision || this.plan !== plan) {
      return;
    }

    const part = plan.parts[index];

    if (!part) {
      this.stop({ stopPlayback: false });
      return;
    }

    const durationSeconds =
      part.durationBeats * getSecondsPerBeat(plan.tempoBpm);
    const cycleEndTime =
      originTime === undefined ? undefined : originTime + durationSeconds;

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
      durationSeconds,
      index,
      originTime,
      plan,
      revision,
    });
  }

  private scheduleNextPart({
    durationSeconds,
    index,
    originTime,
    plan,
    revision,
  }: {
    durationSeconds: number;
    index: number;
    originTime?: number;
    plan: PartSequencePlaybackPlan;
    revision: number;
  }) {
    const nextIndex = (index + 1) % plan.parts.length;
    const nextOriginTime =
      originTime === undefined ? undefined : originTime + durationSeconds;
    const delayMilliseconds =
      nextOriginTime === undefined
        ? durationSeconds * 1000
        : this.getTimerDelayMilliseconds(
            nextOriginTime,
            PART_SEQUENCE_HANDOFF_LEAD_SECONDS,
          );

    this.clearTimer();
    this.timer = globalThis.setTimeout(() => {
      void this.startPartAtIndex({
        handoff: true,
        index: nextIndex,
        originTime: nextOriginTime,
        plan,
        revision,
      });
    }, delayMilliseconds);
  }

  private async startPartAtIndex({
    forceRhythmRestart = false,
    handoff,
    index,
    originTime,
    plan,
    revision,
  }: {
    forceRhythmRestart?: boolean;
    handoff: boolean;
    index: number;
    originTime?: number;
    plan: PartSequencePlaybackPlan;
    revision: number;
  }) {
    if (revision !== this.revision || this.plan !== plan) {
      return false;
    }

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
      rhythms: preserveRhythms ? [] : part.rhythmRequests,
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
        index,
        originTime: startedOriginTime,
        plan,
        revision,
      });
      return true;
    }

    this.timer = globalThis.setTimeout(
      () =>
        this.commitPart({
          index,
          originTime: startedOriginTime,
          plan,
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

    return this.startPartAtIndex({
      handoff: false,
      index: 0,
      plan,
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

    return this.startPartAtIndex({
      forceRhythmRestart: true,
      handoff: true,
      index: Math.min(currentIndex, plan.parts.length - 1),
      plan,
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
      durationSeconds,
      index: currentIndex,
      originTime,
      plan,
      revision,
    });
    return true;
  }

  stop({ stopPlayback = true }: PartSequenceStopOptions = {}) {
    this.clearTimer();
    this.plan = undefined;
    this.revision += 1;
    this.snapshot = idleSnapshot;
    this.emit();

    if (stopPlayback) {
      this.transport.stopPartPlayback();
    }
  }
}

export const partSequenceCoordinator = new PartSequenceCoordinator();
