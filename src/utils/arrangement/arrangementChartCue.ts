import {
  getPartSequencePartIndex,
  getPartSequencePlaybackPartCount,
  type PartSequencePlaybackPlan,
  type PartSequenceSnapshot,
} from "@/audio";

export const ARRANGEMENT_CHART_CUE_LEAD_SECONDS = 1;
export const ARRANGEMENT_CHART_CUE_MIN_SECONDS = 0.25;

export interface ArrangementChartCueInput {
  plan: PartSequencePlaybackPlan;
  snapshot: PartSequenceSnapshot;
  currentSectionStartedAt: number;
}

export interface ArrangementChartCueTarget {
  boundaryTime: number;
  cueTime: number;
  effectiveLeadSeconds: number;
  entryId: string;
  sectionId: string;
  sourceSignature: string;
  tempoSignature: string;
  fromOccurrence: number;
}

function isArrangementSequenceMode(mode: PartSequenceSnapshot["mode"]) {
  return mode === "arrangement" || mode === "arrangement-from-entry";
}

export function deriveArrangementChartCueTarget({
  plan,
  snapshot,
  currentSectionStartedAt,
}: ArrangementChartCueInput): ArrangementChartCueTarget | undefined {
  const activeOccurrence = snapshot.activeOccurrence;
  const cycleEndTime = snapshot.cycleEndTime;
  const activeEntryId = snapshot.activeArrangementContext?.entryId;
  if (
    !snapshot.playing ||
    !isArrangementSequenceMode(snapshot.mode) ||
    activeOccurrence === undefined ||
    cycleEndTime === undefined ||
    !activeEntryId ||
    getPartSequencePlaybackPartCount(plan) === 0
  ) {
    return undefined;
  }

  let boundaryTime = cycleEndTime;
  const playbackPartCount = getPartSequencePlaybackPartCount(plan);
  for (let offset = 1; offset <= playbackPartCount; offset += 1) {
    const occurrence = activeOccurrence + offset;
    if (
      plan.completionPolicy === "stop-at-end" &&
      occurrence >= playbackPartCount
    ) {
      return undefined;
    }
    const step = plan.parts[getPartSequencePartIndex(plan, occurrence)];
    const context = step?.arrangement;
    if (!step || !context) return undefined;

    if (context.entryId !== activeEntryId) {
      const sectionDisplayDurationSeconds = Math.max(
        0,
        boundaryTime - currentSectionStartedAt,
      );
      const effectiveLeadSeconds = Math.min(
        ARRANGEMENT_CHART_CUE_LEAD_SECONDS,
        sectionDisplayDurationSeconds / 2,
      );
      if (effectiveLeadSeconds < ARRANGEMENT_CHART_CUE_MIN_SECONDS) {
        return undefined;
      }
      return {
        boundaryTime,
        cueTime: boundaryTime - effectiveLeadSeconds,
        effectiveLeadSeconds,
        entryId: context.entryId,
        sectionId: context.sectionId,
        sourceSignature: plan.sourceSignature,
        tempoSignature: plan.tempoSignature,
        fromOccurrence: activeOccurrence,
      };
    }

    boundaryTime += step.durationBeats * (60 / step.tempoBpm);
  }

  return undefined;
}
