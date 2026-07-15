import { type MusicPartConfig } from "@/types/session";
import { getRequiredBarDivisionForDurations } from "@/utils/music-theory/chordProgressionRhythm";
import { getPartDurationInBars } from "./partDuration";
import { getPartBandSource } from "./partBand";

const FULL_BAR_DURATION = 1;

export interface SessionRhythmBarConstraint {
  hasSplitBars: boolean;
  requiredBarDivision: number;
}

export function getSessionRhythmBarConstraint(
  parts: readonly MusicPartConfig[],
): SessionRhythmBarConstraint {
  const splitDurations = parts
    .filter(
      (part) =>
        getPartBandSource(part, "rhythm").mode === "session" &&
        getPartDurationInBars(part.durationInBars) < FULL_BAR_DURATION,
    )
    .map((part) => getPartDurationInBars(part.durationInBars));

  return {
    hasSplitBars: splitDurations.length > 0,
    requiredBarDivision: getRequiredBarDivisionForDurations(splitDurations),
  };
}

export function sessionRhythmBeatsPreserveAuthoredBars(
  parts: readonly MusicPartConfig[],
  beats: number,
) {
  const constraint = getSessionRhythmBarConstraint(parts);

  return (
    !constraint.hasSplitBars ||
    constraint.requiredBarDivision <= 1 ||
    beats % constraint.requiredBarDivision === 0
  );
}
