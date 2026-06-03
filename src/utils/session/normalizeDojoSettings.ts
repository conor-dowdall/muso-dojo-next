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
  type InstrumentCreationDefault,
  type KeyboardCreationDefault,
} from "@/types/instrument-creation-defaults";
import { type NoteColorConfig } from "@/types/note-colors";
import { type DojoSettings } from "@/types/session";
import { normalizeNoteColorConfig } from "@/utils/note-colors/createNoteColorConfig";
import {
  defaultInstrumentSetupsMatchRaw,
  isBuiltInDefaultInstrumentSetup,
} from "@/utils/instrument-creation/defaultInstrumentSetup";
import { isRecord } from "@/utils/session/normalizationPrimitives";

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

function normalizeDefaultInstrumentSetupValue(
  value: unknown,
): InstrumentCreationDefault | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.instrumentType === "keyboard") {
    const setup = normalizeKeyboardCreationDefault(value.setup);

    return setup ? { instrumentType: "keyboard", setup } : undefined;
  }

  if (value.instrumentType === "fretboard") {
    const setup = normalizeFretboardCreationDefault(value.setup);

    return setup ? { instrumentType: "fretboard", setup } : undefined;
  }

  return undefined;
}

export function normalizeDefaultInstrumentSetup(
  value: unknown,
): InstrumentCreationDefault | undefined {
  const defaultInstrumentSetup = normalizeDefaultInstrumentSetupValue(value);

  if (
    !defaultInstrumentSetup ||
    isBuiltInDefaultInstrumentSetup(defaultInstrumentSetup)
  ) {
    return undefined;
  }

  return defaultInstrumentSetup;
}

export function normalizeMasterAmbienceSetting(
  value: unknown,
): MasterAmbiencePresetId | undefined {
  const presetId = resolveMasterAmbiencePresetId(value);

  return presetId === DEFAULT_MASTER_AMBIENCE_PRESET_ID ? undefined : presetId;
}

export function defaultInstrumentSetupsAreEqual(
  left: InstrumentCreationDefault | undefined,
  right: InstrumentCreationDefault | undefined,
) {
  if (!left || !right) {
    return left === right;
  }

  return defaultInstrumentSetupsMatchRaw(left, right);
}

export function normalizeDojoSettings(value: unknown): DojoSettings {
  if (!isRecord(value)) {
    return {};
  }

  const appTheme = normalizeAppThemePreference(value.appTheme);
  const noteColorConfig = normalizeNoteColorSetting(value.noteColorConfig);
  const defaultInstrumentSetup = normalizeDefaultInstrumentSetup(
    value.defaultInstrumentSetup,
  );
  const masterAmbiencePresetId = normalizeMasterAmbienceSetting(
    value.masterAmbiencePresetId,
  );

  return {
    ...(appTheme ? { appTheme } : {}),
    ...(noteColorConfig ? { noteColorConfig } : {}),
    ...(defaultInstrumentSetup ? { defaultInstrumentSetup } : {}),
    ...(masterAmbiencePresetId ? { masterAmbiencePresetId } : {}),
  };
}
