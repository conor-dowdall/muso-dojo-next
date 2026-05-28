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
import { normalizeKeyboardThemeName } from "@/data/keyboard/themes";
import { DEFAULT_NOTE_COLOR_CONFIG } from "@/data/noteColors";
import {
  type FretboardCreationAppearanceSource,
  type FretboardCreationDefault,
  type InstrumentCreationDefaults,
  type KeyboardCreationDefault,
} from "@/types/instrument-creation-defaults";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import { type AppPreferences } from "@/types/session";
import { normalizeNoteColorConfig } from "@/utils/note-colors/createNoteColorConfig";
import { isRecord } from "@/utils/session/normalizationPrimitives";

function normalizedNoteColorConfig(value: SessionNoteColorConfig | undefined) {
  return normalizeNoteColorConfig(value) ?? DEFAULT_NOTE_COLOR_CONFIG;
}

export function noteColorConfigsAreEqual(
  left: SessionNoteColorConfig | undefined,
  right: SessionNoteColorConfig | undefined,
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

export function normalizeDefaultSessionNoteColorConfig(
  value: unknown,
): SessionNoteColorConfig | undefined {
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

function normalizeInstrumentCreationDefaults(
  value: unknown,
): InstrumentCreationDefaults | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const keyboard = normalizeKeyboardCreationDefault(value.keyboard);
  const fretboard = normalizeFretboardCreationDefault(value.fretboard);

  if (!keyboard && !fretboard) {
    return undefined;
  }

  return {
    ...(keyboard ? { keyboard } : {}),
    ...(fretboard ? { fretboard } : {}),
  };
}

export function instrumentCreationDefaultsAreEqual(
  left: InstrumentCreationDefaults | undefined,
  right: InstrumentCreationDefaults | undefined,
) {
  return (
    left?.keyboard?.theme === right?.keyboard?.theme &&
    left?.fretboard?.instrument === right?.fretboard?.instrument &&
    left?.fretboard?.tuningKey === right?.fretboard?.tuningKey &&
    left?.fretboard?.handedness === right?.fretboard?.handedness &&
    left?.fretboard?.appearanceSource === right?.fretboard?.appearanceSource &&
    left?.fretboard?.theme === right?.fretboard?.theme &&
    left?.fretboard?.inlayPreset === right?.fretboard?.inlayPreset
  );
}

export function normalizeAppPreferences(value: unknown): AppPreferences {
  if (!isRecord(value)) {
    return {};
  }

  const defaultSessionNoteColorConfig = normalizeDefaultSessionNoteColorConfig(
    value.defaultSessionNoteColorConfig,
  );
  const instrumentCreationDefaults = normalizeInstrumentCreationDefaults(
    value.instrumentCreationDefaults,
  );

  return {
    ...(defaultSessionNoteColorConfig ? { defaultSessionNoteColorConfig } : {}),
    ...(instrumentCreationDefaults ? { instrumentCreationDefaults } : {}),
  };
}
