import { RHYTHM_MAX_BEATS, RHYTHM_MIN_BEATS } from "@/data/rhythmPresets";
import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
  normalizeRhythmSelection,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";

export const PART_DURATION_BEATS_PER_BAR = 4;

const DURATION_EPSILON = 0.000_001;
const DURATION_PRECISION = 1_000_000;

function roundDuration(value: number) {
  return Math.round(value * DURATION_PRECISION) / DURATION_PRECISION;
}

function getDurationBeatCount(value: number) {
  return roundDuration(value * PART_DURATION_BEATS_PER_BAR);
}

function isDefaultBarDuration(value: number) {
  return Math.abs(value - 1) <= DURATION_EPSILON;
}

export function getRepresentablePartDurationBeats(
  durationInBars: number | undefined,
) {
  if (durationInBars === undefined) {
    return undefined;
  }

  const durationBeats = getDurationBeatCount(durationInBars);

  return Number.isInteger(durationBeats) &&
    durationBeats >= RHYTHM_MIN_BEATS &&
    durationBeats <= RHYTHM_MAX_BEATS
    ? durationBeats
    : undefined;
}

export function normalizePartDurationInBars(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  const durationInBars = roundDuration(value);

  if (
    isDefaultBarDuration(durationInBars) ||
    getRepresentablePartDurationBeats(durationInBars) === undefined
  ) {
    return undefined;
  }

  return durationInBars;
}

export function getRhythmSelectionForPartDuration(
  durationInBars: number | undefined,
  selection: RhythmSelection = DEFAULT_RHYTHM_SELECTION,
): RhythmSelection {
  const beats = getRepresentablePartDurationBeats(durationInBars);

  if (beats === undefined) {
    return selection;
  }

  return normalizeRhythmSelection({
    recipe: {
      ...getRhythmSelectionRecipe(selection),
      beats,
    },
    source: "recipe",
  });
}

export function formatPartDurationInBars(durationInBars: number | undefined) {
  const normalizedDuration = normalizePartDurationInBars(durationInBars);

  if (normalizedDuration === undefined) {
    return undefined;
  }

  if (Math.abs(normalizedDuration - 0.5) <= DURATION_EPSILON) {
    return "Half Bar";
  }

  if (Math.abs(normalizedDuration - 0.25) <= DURATION_EPSILON) {
    return "Quarter Bar";
  }

  if (Number.isInteger(normalizedDuration)) {
    return `${normalizedDuration} Bars`;
  }

  const numerator = getDurationBeatCount(normalizedDuration);

  return `${numerator}/${PART_DURATION_BEATS_PER_BAR} Bar`;
}
