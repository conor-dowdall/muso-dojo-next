import { type MusicPartConfig } from "@/types/session";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { getPartBandModule } from "./partBand";

export const DEFAULT_PART_LENGTH_BEATS = 4;
export const MIN_PART_LENGTH_BEATS = 0.125;
export const MAX_PART_LENGTH_BEATS = 128;
const PART_LENGTH_PRECISION = 1_000_000;

function roundPartLength(value: number) {
  return Math.round(value * PART_LENGTH_PRECISION) / PART_LENGTH_PRECISION;
}

export function normalizePartLengthBeats(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < MIN_PART_LENGTH_BEATS ||
    value > MAX_PART_LENGTH_BEATS
  ) {
    return undefined;
  }

  return roundPartLength(value);
}

interface PartLengthInput {
  band?: MusicPartConfig["band"];
  durationInBars?: number;
  modules?: MusicPartConfig["modules"];
}

export function getAutomaticRhythmBeats(part: PartLengthInput) {
  return (
    normalizePartLengthBeats(
      part.durationInBars === undefined
        ? undefined
        : part.durationInBars * DEFAULT_PART_LENGTH_BEATS,
    ) ?? DEFAULT_PART_LENGTH_BEATS
  );
}

export function getPartLengthBeats(part: PartLengthInput) {
  if (part.modules) {
    const rhythm = getPartBandModule(
      {
        band: part.band,
        modules: part.modules,
      },
      "rhythm",
    );

    if (rhythm?.type === "rhythm") {
      return getRhythmSelectionRecipe(rhythm.rhythm).beats;
    }
  }

  return getAutomaticRhythmBeats(part);
}

export function formatPartLengthBeats(lengthBeats: number) {
  const normalized = normalizePartLengthBeats(lengthBeats);
  const resolved = normalized ?? DEFAULT_PART_LENGTH_BEATS;
  const label = resolved.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });

  return `${label} ${resolved === 1 ? "Beat" : "Beats"}`;
}
