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
import { normalizeAppThemePreference } from "@/data/appThemes";
import { normalizeKeyboardRangeName } from "@/data/keyboard/ranges";
import { normalizeKeyboardThemeName } from "@/data/keyboard/themes";
import { DEFAULT_NOTE_COLOR_CONFIG } from "@/data/noteColors";
import {
  DEFAULT_MASTER_AMBIENCE_PRESET_ID,
  resolveMasterAmbiencePresetId,
} from "@/audio/masterAmbience";
import { type MasterAmbiencePresetId } from "@/audio/types";
import {
  type FretboardCreationAppearanceSource,
  type FretboardCreationDefault,
  type FretboardModuleCreationDefault,
  type KeyboardCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationDefaults,
  type ModuleCreationKind,
} from "@/types/instrument-creation-defaults";
import { type NoteColorConfig } from "@/types/note-colors";
import { type DojoSettings } from "@/types/session";
import { normalizeNoteColorConfig } from "@/utils/note-colors/createNoteColorConfig";
import {
  createBuiltInFretboardModuleCreationDefault,
  createBuiltInKeyboardModuleCreationDefault,
  DEFAULT_MODULE_CREATION_KINDS,
  fretboardModuleCreationDefaultsAreEqual,
  keyboardModuleCreationDefaultsAreEqual,
  moduleCreationDefaultsAreEqual,
  moduleCreationKindsAreEqual,
} from "@/utils/instrument-creation/moduleCreationDefaults";
import { normalizeBoundedRange } from "@/utils/range/numberRange";
import { isRecord } from "@/utils/session/normalizationPrimitives";

const MODULE_CREATION_KINDS = {
  drone: true,
  fretboard: true,
  keyboard: true,
} as const satisfies Record<ModuleCreationKind, true>;

const FRET_RANGE_MIN = 0;
const FRET_RANGE_MAX = 24;
const MIN_FRET_RANGE_SPAN = 2;
const MIDI_MIN = 0;
const MIDI_MAX = 127;
const MIN_KEYBOARD_RANGE_SPAN = 11;

function normalizedNoteColorConfig(value: NoteColorConfig | undefined) {
  return normalizeNoteColorConfig(value) ?? DEFAULT_NOTE_COLOR_CONFIG;
}

export function noteColorConfigsAreEqual(
  left: NoteColorConfig | undefined,
  right: NoteColorConfig | undefined,
) {
  const normalizedLeft = normalizedNoteColorConfig(left);
  const normalizedRight = normalizedNoteColorConfig(right);

  if (normalizedLeft.source !== normalizedRight.source) {
    return false;
  }

  if (normalizedLeft.source === "theme") {
    return true;
  }

  if (normalizedLeft.source === "preset") {
    return (
      normalizedRight.source === "preset" &&
      normalizedLeft.preset === normalizedRight.preset
    );
  }

  return (
    normalizedRight.source === "custom" &&
    normalizedLeft.name === normalizedRight.name &&
    normalizedLeft.mode === normalizedRight.mode &&
    normalizedLeft.colors.every(
      (color, index) => color === normalizedRight.colors[index],
    )
  );
}

export function normalizeNoteColorSetting(
  value: unknown,
): NoteColorConfig | undefined {
  const noteColorConfig = normalizeNoteColorConfig(value);

  if (
    !noteColorConfig ||
    noteColorConfigsAreEqual(noteColorConfig, DEFAULT_NOTE_COLOR_CONFIG)
  ) {
    return undefined;
  }

  return noteColorConfig;
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
): StringInstrumentTuningKey {
  const tuningKeys = stringInstrumentTuningKeysByInstrument[instrument];

  return typeof value === "string" &&
    tuningKeys.includes(value as StringInstrumentTuningKey)
    ? (value as StringInstrumentTuningKey)
    : stringInstruments[instrument].defaultTuning;
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

  return {
    instrument,
    tuningKey: normalizeStringInstrumentTuningKey(value.tuningKey, instrument),
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
    moduleCreationKindsAreEqual(moduleKinds, DEFAULT_MODULE_CREATION_KINDS)
  ) {
    return undefined;
  }

  return moduleKinds;
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

export function normalizeModuleCreationDefaults(
  value: unknown,
): ModuleCreationDefaults | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const moduleCreationDefaults = {
    sessionModuleKinds: normalizeModuleCreationKinds(value.sessionModuleKinds),
    partModuleKinds: normalizeModuleCreationKinds(value.partModuleKinds),
    fretboard: normalizeFretboardModuleCreationDefault(value.fretboard),
    keyboard: normalizeKeyboardModuleCreationDefault(value.keyboard),
  } satisfies ModuleCreationDefaults;
  const normalizedDefaults = {
    ...(moduleCreationDefaults.sessionModuleKinds
      ? { sessionModuleKinds: moduleCreationDefaults.sessionModuleKinds }
      : {}),
    ...(moduleCreationDefaults.partModuleKinds
      ? { partModuleKinds: moduleCreationDefaults.partModuleKinds }
      : {}),
    ...(moduleCreationDefaults.fretboard
      ? { fretboard: moduleCreationDefaults.fretboard }
      : {}),
    ...(moduleCreationDefaults.keyboard
      ? { keyboard: moduleCreationDefaults.keyboard }
      : {}),
  } satisfies ModuleCreationDefaults;

  return Object.keys(normalizedDefaults).length === 0
    ? undefined
    : normalizedDefaults;
}

export function normalizeMasterAmbienceSetting(
  value: unknown,
): MasterAmbiencePresetId | undefined {
  const presetId = resolveMasterAmbiencePresetId(value);

  return presetId === DEFAULT_MASTER_AMBIENCE_PRESET_ID ? undefined : presetId;
}

export function normalizeDojoSettings(value: unknown): DojoSettings {
  if (!isRecord(value)) {
    return {};
  }

  const appTheme = normalizeAppThemePreference(value.appTheme);
  const noteColorConfig = normalizeNoteColorSetting(value.noteColorConfig);
  const moduleCreationDefaults = normalizeModuleCreationDefaults(
    value.moduleCreationDefaults,
  );
  const masterAmbiencePresetId = normalizeMasterAmbienceSetting(
    value.masterAmbiencePresetId,
  );

  return {
    ...(appTheme ? { appTheme } : {}),
    ...(noteColorConfig ? { noteColorConfig } : {}),
    ...(moduleCreationDefaults ? { moduleCreationDefaults } : {}),
    ...(masterAmbiencePresetId ? { masterAmbiencePresetId } : {}),
  };
}

export { moduleCreationDefaultsAreEqual };
