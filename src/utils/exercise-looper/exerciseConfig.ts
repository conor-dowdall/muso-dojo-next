import { getDefaultAudioPresetId, isAudioPresetId } from "@/audio/presets";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  type CollectionRangeBoundary,
  type ExercisePattern,
  type ExercisePatternMode,
} from "./exerciseSequence";
import {
  type ExerciseCountInBeats,
  type ExerciseSubdivision,
} from "@/types/session";
import {
  beatSubdivisionIds,
  getBeatSubdivisionStepBeats,
} from "@/utils/music-theory/beatSubdivision";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export { DEFAULT_EXERCISE_OCTAVE_OFFSET };

export const DEFAULT_EXERCISE_COUNT_IN_BEATS = 0 satisfies ExerciseCountInBeats;
export const DEFAULT_EXERCISE_METRONOME_ENABLED = false;
export const DEFAULT_EXERCISE_PATTERN = {
  direction: "up-down",
  extensionDegree: 5,
  extensionDirection: "up-down",
  intervalDegree: 3,
  intervalDirection: "up-down",
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
export const EXERCISE_EXTENSION_DEGREES = [5, 7, 9, 11, 13] as const;

const subdivisions = Object.fromEntries(
  beatSubdivisionIds.map((id) => [id, true]),
) as Record<ExerciseSubdivision, true>;

export const exerciseSubdivisionBeats = Object.fromEntries(
  beatSubdivisionIds.map((id) => [id, getBeatSubdivisionStepBeats(id)]),
) as Record<ExerciseSubdivision, number>;

export function normalizeExerciseCountInBeats(
  value: unknown,
): ExerciseCountInBeats | undefined {
  return value === 0 || value === 2 || value === 3 || value === 4
    ? value
    : undefined;
}

export function normalizeExerciseMetronomeEnabled(
  value: unknown,
): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

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

  const extensionDegree =
    value.extensionDegree === 3 ? 5 : value.extensionDegree;

  if (
    (value.direction !== "ascending" &&
      value.direction !== "descending" &&
      value.direction !== "up-down") ||
    typeof extensionDegree !== "number" ||
    !Number.isInteger(extensionDegree) ||
    !EXERCISE_EXTENSION_DEGREES.includes(
      extensionDegree as (typeof EXERCISE_EXTENSION_DEGREES)[number],
    ) ||
    (value.extensionDirection !== undefined &&
      value.extensionDirection !== "ascending" &&
      value.extensionDirection !== "descending" &&
      value.extensionDirection !== "up-down") ||
    typeof value.intervalDegree !== "number" ||
    !Number.isInteger(value.intervalDegree) ||
    value.intervalDegree < EXERCISE_INTERVAL_MIN ||
    value.intervalDegree > EXERCISE_INTERVAL_MAX ||
    (value.intervalDirection !== undefined &&
      value.intervalDirection !== "ascending" &&
      value.intervalDirection !== "descending" &&
      value.intervalDirection !== "up-down") ||
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
    extensionDegree,
    extensionDirection:
      value.extensionDirection ?? DEFAULT_EXERCISE_PATTERN.extensionDirection,
    intervalDegree: value.intervalDegree,
    intervalDirection:
      value.intervalDirection ?? DEFAULT_EXERCISE_PATTERN.intervalDirection,
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
    left.intervalDirection === right.intervalDirection &&
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
