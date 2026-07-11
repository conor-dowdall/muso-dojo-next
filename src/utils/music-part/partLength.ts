import { type MusicPartConfig, type PartLengthMode } from "@/types/session";
import { getRhythmSelectionRecipe } from "@/utils/rhythm/rhythmConfig";
import { getPartBandModule } from "./partBand";

export const DEFAULT_PART_LENGTH_BEATS = 4;
export const MIN_PART_LENGTH_BEATS = 0.125;
export const MAX_PART_LENGTH_BEATS = 128;
export const USER_PART_LENGTH_BEAT_CHOICES = [
  1, 2, 3, 4, 6, 8, 12, 16,
] as const;

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

export function getFixedPartLengthBeats(
  part: Partial<Pick<MusicPartConfig, "durationInBars" | "lengthBeats">>,
) {
  return (
    normalizePartLengthBeats(part.lengthBeats) ??
    normalizePartLengthBeats(
      part.durationInBars === undefined
        ? undefined
        : part.durationInBars * DEFAULT_PART_LENGTH_BEATS,
    ) ??
    DEFAULT_PART_LENGTH_BEATS
  );
}

export function getPartLengthBeats(
  part: Partial<
    Pick<
      MusicPartConfig,
      "band" | "durationInBars" | "lengthBeats" | "lengthMode" | "modules"
    >
  >,
) {
  if (part.lengthMode === "rhythm" && part.modules) {
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

  return getFixedPartLengthBeats(part);
}

export function getPartLengthMode(
  part: Partial<MusicPartConfig>,
): PartLengthMode {
  return part.lengthMode === "rhythm" &&
    part.modules &&
    getPartBandModule({ band: part.band, modules: part.modules }, "rhythm")
      ?.type === "rhythm"
    ? "rhythm"
    : "fixed";
}

export function formatPartLengthBeats(lengthBeats: number) {
  const normalized = normalizePartLengthBeats(lengthBeats);
  const resolved = normalized ?? DEFAULT_PART_LENGTH_BEATS;
  const label = resolved.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  });

  return `${label} ${resolved === 1 ? "Beat" : "Beats"}`;
}
