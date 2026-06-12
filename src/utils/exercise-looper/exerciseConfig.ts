import { getDefaultAudioPresetId, isAudioPresetId } from "@/audio/presets";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  type CollectionRangeBoundary,
  type ExercisePattern,
  type ExercisePatternMode,
} from "./exerciseSequence";
import { type ExerciseSubdivision } from "@/types/session";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DEFAULT_EXERCISE_PATTERN = {
  direction: "up-down",
  extensionDegree: 3,
  extensionDirection: "up-down",
  intervalDegree: 3,
  mode: "single",
  notePlayback: "separate",
} as const satisfies ExercisePattern;
export const DEFAULT_EXERCISE_SUBDIVISION =
  "quarter" satisfies ExerciseSubdivision;
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
export const EXERCISE_INTERVAL_DEGREES = Array.from(
  { length: EXERCISE_INTERVAL_MAX - EXERCISE_INTERVAL_MIN + 1 },
  (_, index) => index + EXERCISE_INTERVAL_MIN,
);
export const EXERCISE_EXTENSION_DEGREES = [3, 5, 7, 9, 11, 13] as const;

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
  if (
    !isRecord(value) ||
    (value.direction !== "ascending" &&
      value.direction !== "descending" &&
      value.direction !== "up-down") ||
    typeof value.extensionDegree !== "number" ||
    !Number.isInteger(value.extensionDegree) ||
    !EXERCISE_EXTENSION_DEGREES.includes(
      value.extensionDegree as (typeof EXERCISE_EXTENSION_DEGREES)[number],
    ) ||
    (value.extensionDirection !== undefined &&
      value.extensionDirection !== "ascending" &&
      value.extensionDirection !== "descending" &&
      value.extensionDirection !== "up-down") ||
    typeof value.intervalDegree !== "number" ||
    !Number.isInteger(value.intervalDegree) ||
    value.intervalDegree < EXERCISE_INTERVAL_MIN ||
    value.intervalDegree > EXERCISE_INTERVAL_MAX ||
    (value.mode !== "single" &&
      value.mode !== "interval" &&
      value.mode !== "extension") ||
    (value.notePlayback !== undefined &&
      value.notePlayback !== "separate" &&
      value.notePlayback !== "together")
  ) {
    return undefined;
  }

  return {
    direction: value.direction,
    extensionDegree: value.extensionDegree,
    extensionDirection:
      value.extensionDirection ?? DEFAULT_EXERCISE_PATTERN.extensionDirection,
    intervalDegree: value.intervalDegree,
    mode: value.mode,
    notePlayback: value.notePlayback ?? DEFAULT_EXERCISE_PATTERN.notePlayback,
  };
}

export function exercisePatternsAreEqual(
  left: ExercisePattern,
  right: ExercisePattern,
) {
  return (
    left.direction === right.direction &&
    left.extensionDegree === right.extensionDegree &&
    left.extensionDirection === right.extensionDirection &&
    left.intervalDegree === right.intervalDegree &&
    left.mode === right.mode &&
    left.notePlayback === right.notePlayback
  );
}

export function getExerciseDegreeOptions(
  mode: Exclude<ExercisePatternMode, "single">,
): readonly number[] {
  return mode === "extension"
    ? EXERCISE_EXTENSION_DEGREES
    : EXERCISE_INTERVAL_DEGREES;
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
