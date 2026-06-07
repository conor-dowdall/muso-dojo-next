import { getDefaultAudioPresetId, isAudioPresetId } from "@/audio/presets";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  EXERCISE_STACK_SIZE_MAX,
  EXERCISE_STACK_SIZE_MIN,
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "./exerciseSequence";
import { type ExerciseSubdivision } from "@/types/session";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DEFAULT_EXERCISE_PATTERN = {
  direction: "up-down",
  kind: "scale",
} as const satisfies ExercisePattern;
export const DEFAULT_EXERCISE_SUBDIVISION =
  "eighth" satisfies ExerciseSubdivision;
export const DEFAULT_EXERCISE_START = {
  octave: 0,
  stepOffset: 0,
} as const satisfies CollectionRangeBoundary;
export const DEFAULT_EXERCISE_END = {
  octave: 1,
  stepOffset: 0,
} as const satisfies CollectionRangeBoundary;
export const EXERCISE_MIN_OCTAVE_OFFSET = -4;
export const EXERCISE_MAX_OCTAVE_OFFSET = 5;

const subdivisions = {
  quarter: true,
  eighth: true,
  "eighth-triplet": true,
  sixteenth: true,
  "sixteenth-triplet": true,
} as const satisfies Record<ExerciseSubdivision, true>;

export const exerciseSubdivisionBeats = {
  quarter: 1,
  eighth: 1 / 2,
  "eighth-triplet": 1 / 3,
  sixteenth: 1 / 4,
  "sixteenth-triplet": 1 / 6,
} as const satisfies Record<ExerciseSubdivision, number>;

export function normalizeExerciseSubdivision(
  value: unknown,
): ExerciseSubdivision | undefined {
  return typeof value === "string" && value in subdivisions
    ? (value as ExerciseSubdivision)
    : undefined;
}

export function normalizeCollectionRangeBoundary(
  value: unknown,
): CollectionRangeBoundary | undefined {
  if (
    !isRecord(value) ||
    typeof value.octave !== "number" ||
    !Number.isInteger(value.octave) ||
    typeof value.stepOffset !== "number" ||
    !Number.isInteger(value.stepOffset) ||
    value.octave < -8 ||
    value.octave > 8 ||
    value.stepOffset < -24 ||
    value.stepOffset > 24
  ) {
    return undefined;
  }

  return {
    octave: value.octave,
    stepOffset: value.stepOffset,
  };
}

export function normalizeExercisePattern(
  value: unknown,
): ExercisePattern | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (
    value.kind === "scale" &&
    (value.direction === "ascending" ||
      value.direction === "descending" ||
      value.direction === "up-down")
  ) {
    return { direction: value.direction, kind: value.kind };
  }

  if (
    value.kind === "interval-run" &&
    typeof value.interval === "number" &&
    Number.isInteger(value.interval) &&
    value.interval >= EXERCISE_INTERVAL_MIN &&
    value.interval <= EXERCISE_INTERVAL_MAX
  ) {
    return { interval: value.interval, kind: value.kind };
  }

  if (
    value.kind === "diatonic-stack" &&
    typeof value.size === "number" &&
    Number.isInteger(value.size) &&
    value.size >= EXERCISE_STACK_SIZE_MIN &&
    value.size <= EXERCISE_STACK_SIZE_MAX
  ) {
    return { kind: value.kind, size: value.size };
  }

  return undefined;
}

export function exercisePatternsAreEqual(
  left: ExercisePattern,
  right: ExercisePattern,
) {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === "scale" && right.kind === "scale") {
    return left.direction === right.direction;
  }

  if (left.kind === "interval-run" && right.kind === "interval-run") {
    return left.interval === right.interval;
  }

  return (
    left.kind === "diatonic-stack" &&
    right.kind === "diatonic-stack" &&
    left.size === right.size
  );
}

export function boundariesAreEqual(
  left: CollectionRangeBoundary,
  right: CollectionRangeBoundary,
) {
  return left.octave === right.octave && left.stepOffset === right.stepOffset;
}

export function normalizeExerciseAudioPresetId(value: unknown) {
  return isAudioPresetId(value) && value !== getDefaultAudioPresetId("exercise")
    ? value
    : undefined;
}

export function normalizeExerciseWood(value: unknown) {
  const wood = normalizeWoodSurfaceId(value);
  return wood && wood !== DEFAULT_WOOD_SURFACE_ID ? wood : undefined;
}
