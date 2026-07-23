import {
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
  fromOccurrence: number;
}

export function deriveArrangementChartCueTarget({
  plan,
  snapshot,
  currentSectionStartedAt,
}: ArrangementChartCueInput): ArrangementChartCueTarget | undefined {
  const activeOccurrence = snapshot.activeOccurrence;
  const cycleEndTime = snapshot.cycleEndTime;
  const activeSectionId = snapshot.activeArrangementContext?.sectionId;
  if (
    !snapshot.playing ||
    snapshot.mode !== "arrangement" ||
    activeOccurrence === undefined ||
    cycleEndTime === undefined ||
    !activeSectionId ||
    plan.parts.length === 0
  ) {
    return undefined;
  }

  let boundaryTime = cycleEndTime;
  for (let offset = 1; offset <= plan.parts.length; offset += 1) {
    const occurrence = activeOccurrence + offset;
    if (
      plan.completionPolicy === "stop-at-end" &&
      occurrence >= plan.parts.length
    ) {
      return undefined;
    }
    const step = plan.parts[occurrence % plan.parts.length];
    const context = step?.arrangement;
    if (!step || !context) return undefined;

    if (context.sectionId !== activeSectionId) {
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
        fromOccurrence: activeOccurrence,
      };
    }

    boundaryTime += step.durationBeats * (60 / plan.tempoBpm);
  }

  return undefined;
}
