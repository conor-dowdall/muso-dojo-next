import { RHYTHM_MAX_BEATS, RHYTHM_MIN_BEATS } from "@/data/rhythmPresets";
import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
  normalizeRhythmSelection,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";

export const PART_DURATION_BEATS_PER_BAR = 4;
export const PART_DURATION_CHART_BAR_UNITS = 420;

const DURATION_EPSILON = 0.000_001;
const DURATION_PRECISION = 1_000_000;

interface SimpleBarFraction {
  denominator: number;
  numerator: number;
}

function roundDuration(value: number) {
  return Math.round(value * DURATION_PRECISION) / DURATION_PRECISION;
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b > 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function getDurationBeatCount(
  value: number,
  beatsPerBar = PART_DURATION_BEATS_PER_BAR,
) {
  return roundDuration(value * beatsPerBar);
}

function isDefaultBarDuration(value: number) {
  return Math.abs(value - 1) <= DURATION_EPSILON;
}

function getSimpleBarFraction(
  value: number,
  maxDenominator = RHYTHM_MAX_BEATS,
): SimpleBarFraction | undefined {
  for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
    const numerator = Math.round(value * denominator);

    if (
      numerator > 0 &&
      Math.abs(value - numerator / denominator) <= DURATION_EPSILON
    ) {
      const divisor = gcd(numerator, denominator);

      return {
        denominator: denominator / divisor,
        numerator: numerator / divisor,
      };
    }
  }

  return undefined;
}

export function getRepresentablePartDurationBeats(
  durationInBars: number | undefined,
  beatsPerBar = PART_DURATION_BEATS_PER_BAR,
) {
  if (durationInBars === undefined) {
    return undefined;
  }

  const durationBeats = getDurationBeatCount(durationInBars, beatsPerBar);

  return Number.isInteger(durationBeats) &&
    durationBeats >= RHYTHM_MIN_BEATS &&
    durationBeats <= RHYTHM_MAX_BEATS
    ? durationBeats
    : undefined;
}

export function getPartDurationChartUnits(durationInBars: number | undefined) {
  const normalizedDuration = getPartDurationInBars(durationInBars);

  return Math.max(
    1,
    Math.min(
      PART_DURATION_CHART_BAR_UNITS,
      Math.round(normalizedDuration * PART_DURATION_CHART_BAR_UNITS),
    ),
  );
}

export function isPartialPartDuration(durationInBars: number | undefined) {
  const normalizedDuration = normalizePartDurationInBars(durationInBars);

  return normalizedDuration !== undefined && normalizedDuration < 1;
}

export function normalizePartDurationInBars(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  const durationInBars = roundDuration(value);

  if (
    isDefaultBarDuration(durationInBars) ||
    (getRepresentablePartDurationBeats(durationInBars) === undefined &&
      getSimpleBarFraction(durationInBars) === undefined)
  ) {
    return undefined;
  }

  return durationInBars;
}

export function getPartDurationInBars(durationInBars: number | undefined) {
  return normalizePartDurationInBars(durationInBars) ?? 1;
}

export function getPartDurationBeats(
  durationInBars: number | undefined,
  beatsPerBar = PART_DURATION_BEATS_PER_BAR,
) {
  const normalizedDuration = normalizePartDurationInBars(durationInBars);

  return normalizedDuration === undefined
    ? undefined
    : getDurationBeatCount(normalizedDuration, beatsPerBar);
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

export function getRhythmSelectionForBeatCount(
  beats: number | undefined,
  selection: RhythmSelection = DEFAULT_RHYTHM_SELECTION,
): RhythmSelection {
  if (
    beats === undefined ||
    !Number.isInteger(beats) ||
    beats < RHYTHM_MIN_BEATS ||
    beats > RHYTHM_MAX_BEATS
  ) {
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
