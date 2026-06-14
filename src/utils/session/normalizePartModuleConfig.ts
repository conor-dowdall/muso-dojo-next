import {
  type DronePartModuleConfig,
  type ExerciseLooperPartModuleConfig,
  type InstrumentPartModuleConfig,
  type PartModuleConfig,
} from "@/types/session";
import { getDefaultAudioPresetId, isAudioPresetId } from "@/audio/presets";
import { assertNever } from "@/utils/assertNever";
import { normalizeInstrumentInstanceConfig } from "@/utils/session/normalizeInstrumentConfig";
import { isPartModuleType } from "@/utils/session/partModuleTypes";
import { isRecord, normalizeId } from "@/utils/session/normalizationPrimitives";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MAX_OCTAVE_ROWS,
  DRONE_MAX_NOTE_COUNT,
  DRONE_MIN_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_ROWS,
  DRONE_MIN_NOTE_COUNT,
} from "@/utils/drone/droneNotes";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  boundariesAreEqual,
  DEFAULT_EXERCISE_COUNT_IN_BEATS,
  DEFAULT_EXERCISE_END,
  DEFAULT_EXERCISE_PATTERN,
  DEFAULT_EXERCISE_START,
  DEFAULT_EXERCISE_SUBDIVISION,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
  exercisePatternsAreEqual,
  normalizeCollectionRangeBoundary,
  normalizeExerciseAudioPresetId,
  normalizeExerciseCountInBeats,
  normalizeExercisePattern,
  normalizeExerciseSubdivision,
  normalizeExerciseWood,
} from "@/utils/exercise-looper/exerciseConfig";

function normalizeDroneAudioPresetId(value: unknown) {
  return isAudioPresetId(value) && value !== getDefaultAudioPresetId("drone")
    ? value
    : undefined;
}

function normalizeDroneWood(value: unknown) {
  const wood = normalizeWoodSurfaceId(value);

  return wood && wood !== DEFAULT_WOOD_SURFACE_ID ? wood : undefined;
}

function normalizeOptionalDroneInteger({
  defaultValue,
  max,
  min,
  value,
}: {
  defaultValue: number;
  max: number;
  min: number;
  value: unknown;
}) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max ||
    value === defaultValue
  ) {
    return undefined;
  }

  return value;
}

function normalizeDroneOctaveOffset(value: unknown) {
  return normalizeOptionalDroneInteger({
    defaultValue: 0,
    max: DRONE_MAX_OCTAVE_OFFSET,
    min: DRONE_MIN_OCTAVE_OFFSET,
    value,
  });
}

function normalizeDroneOctaveRowCount(value: unknown) {
  return normalizeOptionalDroneInteger({
    defaultValue: DRONE_MIN_OCTAVE_ROWS,
    max: DRONE_MAX_OCTAVE_ROWS,
    min: DRONE_MIN_OCTAVE_ROWS,
    value,
  });
}

function normalizeDroneNoteCount(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < DRONE_MIN_NOTE_COUNT ||
    value > DRONE_MAX_NOTE_COUNT
  ) {
    return undefined;
  }

  return value;
}

export function normalizePartModuleConfig(
  value: unknown,
  index = 0,
): PartModuleConfig | undefined {
  if (!isRecord(value) || !isPartModuleType(value.type)) {
    return undefined;
  }

  switch (value.type) {
    case "drone": {
      const audioPresetId = normalizeDroneAudioPresetId(value.audioPresetId);
      const noteCount = normalizeDroneNoteCount(value.noteCount);
      const octaveOffset = normalizeDroneOctaveOffset(value.octaveOffset);
      const octaveRowCount =
        noteCount === undefined
          ? normalizeDroneOctaveRowCount(value.octaveRowCount)
          : undefined;
      const wood = normalizeDroneWood(value.wood);

      return {
        id: normalizeId(value.id, `module-${index + 1}`),
        ...(audioPresetId ? { audioPresetId } : {}),
        ...(noteCount !== undefined ? { noteCount } : {}),
        ...(octaveOffset !== undefined ? { octaveOffset } : {}),
        ...(octaveRowCount !== undefined ? { octaveRowCount } : {}),
        type: value.type,
        ...(wood ? { wood } : {}),
      } satisfies DronePartModuleConfig;
    }
    case "exercise-looper": {
      const audioPresetId = normalizeExerciseAudioPresetId(value.audioPresetId);
      const countInBeats = normalizeExerciseCountInBeats(value.countInBeats);
      const start = normalizeCollectionRangeBoundary(value.start);
      const end = normalizeCollectionRangeBoundary(value.end);
      const pattern = normalizeExercisePattern(value.pattern);
      const subdivision = normalizeExerciseSubdivision(value.subdivision);
      const octaveOffset = normalizeOptionalDroneInteger({
        defaultValue: 0,
        max: EXERCISE_MAX_OCTAVE_OFFSET,
        min: EXERCISE_MIN_OCTAVE_OFFSET,
        value: value.octaveOffset,
      });
      const wood = normalizeExerciseWood(value.wood);

      return {
        id: normalizeId(value.id, `module-${index + 1}`),
        ...(audioPresetId ? { audioPresetId } : {}),
        ...(countInBeats !== undefined &&
        countInBeats !== DEFAULT_EXERCISE_COUNT_IN_BEATS
          ? { countInBeats }
          : {}),
        ...(end && !boundariesAreEqual(end, DEFAULT_EXERCISE_END)
          ? { end }
          : {}),
        ...(octaveOffset !== undefined ? { octaveOffset } : {}),
        ...(pattern &&
        !exercisePatternsAreEqual(pattern, DEFAULT_EXERCISE_PATTERN)
          ? { pattern }
          : {}),
        ...(start && !boundariesAreEqual(start, DEFAULT_EXERCISE_START)
          ? { start }
          : {}),
        ...(subdivision && subdivision !== DEFAULT_EXERCISE_SUBDIVISION
          ? { subdivision }
          : {}),
        type: value.type,
        ...(wood ? { wood } : {}),
      } satisfies ExerciseLooperPartModuleConfig;
    }
    case "instrument": {
      const instrument = normalizeInstrumentInstanceConfig(value.instrument);

      if (!instrument) {
        return undefined;
      }

      return {
        id: normalizeId(value.id, `module-${index + 1}`),
        type: value.type,
        instrument,
      } satisfies InstrumentPartModuleConfig;
    }
    default:
      return assertNever(value.type, "Unsupported part module type");
  }
}
