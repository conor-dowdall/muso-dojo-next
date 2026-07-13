import {
  stringInstrumentTuningKeysByInstrument,
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import {
  DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  customFretboardInlayPresetOptions,
  type CustomFretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import { normalizeFretboardThemeName } from "@/data/fretboard/themes";
import { normalizeKeyboardRangeName } from "@/data/keyboard/ranges";
import { normalizeKeyboardThemeName } from "@/data/keyboard/themes";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MIN_OCTAVE_OFFSET,
} from "@/utils/drone/droneNotes";
import {
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import { getDefaultAudioPresetId, isAudioPresetId } from "@/audio/presets";
import {
  type DroneModuleCreationDefault,
  type ExerciseLooperModuleCreationDefault,
  type FretboardCreationAppearanceSource,
  type FretboardCreationDefault,
  type FretboardModuleCreationDefault,
  type KeyboardCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationDefaults,
  type ModuleCreationKind,
  type RhythmModuleCreationDefault,
} from "@/types/instrument-creation-defaults";
import {
  createBuiltInDroneModuleCreationDefault,
  createBuiltInExerciseLooperModuleCreationDefault,
  createBuiltInFretboardModuleCreationDefault,
  createBuiltInKeyboardModuleCreationDefault,
  createBuiltInRhythmModuleCreationDefault,
  DEFAULT_PART_MODULE_CREATION_KINDS,
  DEFAULT_SESSION_MODULE_CREATION_KINDS,
  DEFAULT_MODULE_CREATION_KINDS,
  droneModuleCreationDefaultsAreEqual,
  exerciseLooperModuleCreationDefaultsAreEqual,
  fretboardModuleCreationDefaultsAreEqual,
  keyboardModuleCreationDefaultsAreEqual,
  moduleCreationDefaultsAreEqual,
  moduleCreationKindsAreEqual,
  rhythmModuleCreationDefaultsAreEqual,
} from "@/utils/instrument-creation/moduleCreationDefaults";
import { normalizeBoundedRange } from "@/utils/range/numberRange";
import {
  DEFAULT_RHYTHM_SELECTION,
  normalizeRhythmSelection,
  rhythmSelectionsAreEqual,
} from "@/utils/rhythm/rhythmConfig";
import { isRecord } from "@/utils/session/normalizationPrimitives";
import {
  normalizeCustomTuningName,
  normalizeCustomTuningNotes,
} from "@/utils/fretboard/customFretboardTunings";

const MODULE_CREATION_KINDS = {
  drone: true,
  "exercise-looper": true,
  fretboard: true,
  keyboard: true,
  rhythm: true,
} as const satisfies Record<ModuleCreationKind, true>;

const FRET_RANGE_MIN = 0;
const FRET_RANGE_MAX = 24;
const MIN_FRET_RANGE_SPAN = 2;
const MIDI_MIN = 0;
const MIDI_MAX = 127;
const MIN_KEYBOARD_RANGE_SPAN = 11;

function normalizeIntegerInRange({
  fallback,
  max,
  min,
  value,
}: {
  fallback: number;
  max: number;
  min: number;
  value: unknown;
}) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : fallback;
}

function normalizeStringInstrumentKey(
  value: unknown,
): StringInstrumentKey | undefined {
  return typeof value === "string" && value in stringInstruments
    ? (value as StringInstrumentKey)
    : undefined;
}

function normalizeStringInstrumentTuningKey(
  value: unknown,
  instrument: StringInstrumentKey,
): StringInstrumentTuningKey | undefined {
  const tuningKeys = stringInstrumentTuningKeysByInstrument[instrument];

  return typeof value === "string" &&
    tuningKeys.includes(value as StringInstrumentTuningKey)
    ? (value as StringInstrumentTuningKey)
    : undefined;
}

function normalizeHandedness(value: unknown): "right" | "left" {
  return value === "left" ? "left" : "right";
}

function normalizeAppearanceSource(
  value: unknown,
): FretboardCreationAppearanceSource {
  return value === "custom" ? "custom" : "auto";
}

function normalizeCustomInlayPreset(
  value: unknown,
): CustomFretboardInlayPresetName {
  return typeof value === "string" &&
    customFretboardInlayPresetOptions.includes(
      value as CustomFretboardInlayPresetName,
    )
    ? (value as CustomFretboardInlayPresetName)
    : DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET;
}

export function normalizeKeyboardCreationDefault(
  value: unknown,
): KeyboardCreationDefault | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const theme = normalizeKeyboardThemeName(value.theme);

  return theme ? { theme } : undefined;
}

export function normalizeFretboardCreationDefault(
  value: unknown,
): FretboardCreationDefault | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const instrument = normalizeStringInstrumentKey(value.instrument);

  if (!instrument) {
    return undefined;
  }

  const theme =
    normalizeFretboardThemeName(value.theme) ??
    getDefaultFretboardWoodThemeName(instrument);

  const tuning = normalizeCustomTuningNotes(value.tuning);
  const tuningKey = tuning
    ? undefined
    : (normalizeStringInstrumentTuningKey(value.tuningKey, instrument) ??
      stringInstruments[instrument].defaultTuning);
  const tuningName = tuning
    ? normalizeCustomTuningName(value.tuningName)
    : undefined;

  return {
    instrument,
    ...(tuningKey ? { tuningKey } : {}),
    ...(tuning ? { tuning } : {}),
    ...(tuningName ? { tuningName } : {}),
    handedness: normalizeHandedness(value.handedness),
    appearanceSource: normalizeAppearanceSource(value.appearanceSource),
    theme,
    inlayPreset: normalizeCustomInlayPreset(value.inlayPreset),
  };
}

export function normalizeInstrumentCreationDefault(
  instrumentType: "keyboard",
  value: unknown,
): KeyboardCreationDefault | undefined;
export function normalizeInstrumentCreationDefault(
  instrumentType: "fretboard",
  value: unknown,
): FretboardCreationDefault | undefined;
export function normalizeInstrumentCreationDefault(
  instrumentType: "keyboard" | "fretboard",
  value: unknown,
) {
  return instrumentType === "keyboard"
    ? normalizeKeyboardCreationDefault(value)
    : normalizeFretboardCreationDefault(value);
}

function normalizeModuleCreationKind(
  value: unknown,
): ModuleCreationKind | undefined {
  return typeof value === "string" && value in MODULE_CREATION_KINDS
    ? (value as ModuleCreationKind)
    : undefined;
}

function normalizeModuleCreationKinds(
  value: unknown,
  fallback: readonly ModuleCreationKind[] = DEFAULT_MODULE_CREATION_KINDS,
): ModuleCreationKind[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const usedKinds = new Set<ModuleCreationKind>();
  const moduleKinds = value.reduce<ModuleCreationKind[]>((kinds, item) => {
    const kind = normalizeModuleCreationKind(item);

    if (!kind || usedKinds.has(kind)) {
      return kinds;
    }

    usedKinds.add(kind);
    return [...kinds, kind];
  }, []);

  if (
    moduleKinds.length === 0 ||
    moduleCreationKindsAreEqual(moduleKinds, fallback, fallback)
  ) {
    return undefined;
  }

  return moduleKinds;
}

function normalizeModuleCreationKindDefaults(
  value: unknown,
): ModuleCreationDefaults["moduleKindDefaults"] {
  if (!isRecord(value)) {
    return undefined;
  }

  const session = normalizeModuleCreationKinds(
    value.session,
    DEFAULT_SESSION_MODULE_CREATION_KINDS,
  );
  const part = normalizeModuleCreationKinds(
    value.part,
    DEFAULT_PART_MODULE_CREATION_KINDS,
  );

  const moduleKindDefaults = {
    ...(session ? { session } : {}),
    ...(part ? { part } : {}),
  } satisfies ModuleCreationDefaults["moduleKindDefaults"];

  return Object.keys(moduleKindDefaults).length === 0
    ? undefined
    : moduleKindDefaults;
}

function normalizeFretboardCreationRangeDefault(
  value: unknown,
): FretboardModuleCreationDefault["range"] {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.source !== "custom" || !Array.isArray(value.fretRange)) {
    return undefined;
  }

  const fretRange = normalizeBoundedRange(
    [Number(value.fretRange[0]), Number(value.fretRange[1])],
    {
      max: FRET_RANGE_MAX,
      min: FRET_RANGE_MIN,
      minSpan: MIN_FRET_RANGE_SPAN,
    },
  );

  return {
    source: "custom",
    fretRange: [fretRange[0], fretRange[1]],
  };
}

function normalizeKeyboardCreationRangeDefault(
  value: unknown,
): KeyboardModuleCreationDefault["range"] {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.source === "named") {
    const range = normalizeKeyboardRangeName(value.range);

    return range ? { source: "named", range } : undefined;
  }

  if (value.source !== "custom" || !Array.isArray(value.midiRange)) {
    return undefined;
  }

  const midiRange = normalizeBoundedRange(
    [Number(value.midiRange[0]), Number(value.midiRange[1])],
    {
      max: MIDI_MAX,
      min: MIDI_MIN,
      minSpan: MIN_KEYBOARD_RANGE_SPAN,
    },
  );

  return {
    source: "custom",
    midiRange: [midiRange[0], midiRange[1]],
  };
}

export function normalizeFretboardModuleCreationDefault(
  value: unknown,
): FretboardModuleCreationDefault | undefined {
  const setup = normalizeFretboardCreationDefault(value);

  if (!setup || !isRecord(value)) {
    return undefined;
  }

  const range = normalizeFretboardCreationRangeDefault(value.range);
  const defaultValue = {
    ...setup,
    ...(range ? { range } : {}),
  } satisfies FretboardModuleCreationDefault;

  return fretboardModuleCreationDefaultsAreEqual(
    defaultValue,
    createBuiltInFretboardModuleCreationDefault(),
  )
    ? undefined
    : defaultValue;
}

export function normalizeKeyboardModuleCreationDefault(
  value: unknown,
): KeyboardModuleCreationDefault | undefined {
  const setup = normalizeKeyboardCreationDefault(value);

  if (!setup || !isRecord(value)) {
    return undefined;
  }

  const range = normalizeKeyboardCreationRangeDefault(value.range);
  const defaultValue = {
    ...setup,
    ...(range ? { range } : {}),
  } satisfies KeyboardModuleCreationDefault;

  return keyboardModuleCreationDefaultsAreEqual(
    defaultValue,
    createBuiltInKeyboardModuleCreationDefault(),
  )
    ? undefined
    : defaultValue;
}

export function normalizeDroneModuleCreationDefault(
  value: unknown,
): DroneModuleCreationDefault | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const wood = normalizeWoodSurfaceId(value.wood) ?? DEFAULT_WOOD_SURFACE_ID;
  const octaveOffset = normalizeIntegerInRange({
    fallback: 0,
    max: DRONE_MAX_OCTAVE_OFFSET,
    min: DRONE_MIN_OCTAVE_OFFSET,
    value: value.octaveOffset,
  });
  const defaultValue = {
    octaveOffset,
    wood,
  } satisfies DroneModuleCreationDefault;

  return droneModuleCreationDefaultsAreEqual(
    defaultValue,
    createBuiltInDroneModuleCreationDefault(),
  )
    ? undefined
    : {
        ...(octaveOffset !== 0 ? { octaveOffset } : {}),
        ...(wood !== DEFAULT_WOOD_SURFACE_ID ? { wood } : {}),
      };
}

export function normalizeExerciseLooperModuleCreationDefault(
  value: unknown,
): ExerciseLooperModuleCreationDefault | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const wood = normalizeWoodSurfaceId(value.wood) ?? DEFAULT_WOOD_SURFACE_ID;
  const audioPresetId = isAudioPresetId(value.audioPresetId)
    ? value.audioPresetId
    : getDefaultAudioPresetId("exercise");
  const octaveOffset = normalizeIntegerInRange({
    fallback: DEFAULT_EXERCISE_OCTAVE_OFFSET,
    max: EXERCISE_MAX_OCTAVE_OFFSET,
    min: EXERCISE_MIN_OCTAVE_OFFSET,
    value: value.octaveOffset,
  });
  const defaultValue = {
    audioPresetId,
    octaveOffset,
    wood,
  } satisfies ExerciseLooperModuleCreationDefault;

  return exerciseLooperModuleCreationDefaultsAreEqual(
    defaultValue,
    createBuiltInExerciseLooperModuleCreationDefault(),
  )
    ? undefined
    : {
        ...(audioPresetId !== getDefaultAudioPresetId("exercise")
          ? { audioPresetId }
          : {}),
        ...(octaveOffset !== DEFAULT_EXERCISE_OCTAVE_OFFSET
          ? { octaveOffset }
          : {}),
        ...(wood !== DEFAULT_WOOD_SURFACE_ID ? { wood } : {}),
      };
}

export function normalizeRhythmModuleCreationDefault(
  value: unknown,
): RhythmModuleCreationDefault | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const wood = normalizeWoodSurfaceId(value.wood) ?? DEFAULT_WOOD_SURFACE_ID;
  const rhythm = normalizeRhythmSelection(value.rhythm);
  const defaultValue = { rhythm, wood } satisfies RhythmModuleCreationDefault;

  return rhythmModuleCreationDefaultsAreEqual(
    defaultValue,
    createBuiltInRhythmModuleCreationDefault(),
  )
    ? undefined
    : {
        ...(!rhythmSelectionsAreEqual(rhythm, DEFAULT_RHYTHM_SELECTION)
          ? { rhythm }
          : {}),
        ...(wood !== DEFAULT_WOOD_SURFACE_ID ? { wood } : {}),
      };
}

export function normalizeModuleCreationDefaults(
  value: unknown,
): ModuleCreationDefaults | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const moduleCreationDefaults = {
    moduleKindDefaults: normalizeModuleCreationKindDefaults(
      value.moduleKindDefaults,
    ),
    drone: normalizeDroneModuleCreationDefault(value.drone),
    exerciseLooper: normalizeExerciseLooperModuleCreationDefault(
      value.exerciseLooper,
    ),
    fretboard: normalizeFretboardModuleCreationDefault(value.fretboard),
    keyboard: normalizeKeyboardModuleCreationDefault(value.keyboard),
    rhythm: normalizeRhythmModuleCreationDefault(value.rhythm),
  } satisfies ModuleCreationDefaults;
  const normalizedDefaults = {
    ...(moduleCreationDefaults.moduleKindDefaults
      ? { moduleKindDefaults: moduleCreationDefaults.moduleKindDefaults }
      : {}),
    ...(moduleCreationDefaults.drone
      ? { drone: moduleCreationDefaults.drone }
      : {}),
    ...(moduleCreationDefaults.exerciseLooper
      ? { exerciseLooper: moduleCreationDefaults.exerciseLooper }
      : {}),
    ...(moduleCreationDefaults.fretboard
      ? { fretboard: moduleCreationDefaults.fretboard }
      : {}),
    ...(moduleCreationDefaults.keyboard
      ? { keyboard: moduleCreationDefaults.keyboard }
      : {}),
    ...(moduleCreationDefaults.rhythm
      ? { rhythm: moduleCreationDefaults.rhythm }
      : {}),
  } satisfies ModuleCreationDefaults;

  return Object.keys(normalizedDefaults).length === 0
    ? undefined
    : normalizedDefaults;
}

export { moduleCreationDefaultsAreEqual };
