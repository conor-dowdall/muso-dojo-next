import {
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import {
  DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  fretboardInlayPresets,
  type CustomFretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import {
  DEFAULT_KEYBOARD_RANGE,
  keyboardRanges,
  type KeyboardRangeName,
} from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
import {
  type InstrumentCreationConfig,
  type InstrumentType,
  type PartModuleCreationConfig,
} from "@/types/session";

export type KeyboardRangeSelection = KeyboardRangeName | "custom";

export interface KeyboardInstrumentSelection {
  range: KeyboardRangeSelection;
  midiRange: readonly [number, number];
  theme: KeyboardThemeName;
}

export type FretboardAppearanceSource = "auto" | "custom";

export interface FretboardInstrumentSelection {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  fretRange: readonly [number, number];
  handedness: "right" | "left";
  appearanceSource: FretboardAppearanceSource;
  theme: FretboardThemeName;
  inlayPreset: CustomFretboardInlayPresetName;
}

export const defaultKeyboardInstrumentSelection: KeyboardInstrumentSelection = {
  range: DEFAULT_KEYBOARD_RANGE,
  midiRange: keyboardRanges[DEFAULT_KEYBOARD_RANGE].midiRange,
  theme: DEFAULT_KEYBOARD_THEME,
};

export const defaultFretboardInstrumentSelection: FretboardInstrumentSelection =
  {
    instrument: "guitar",
    tuningKey: stringInstruments.guitar.defaultTuning,
    fretRange: [0, 12],
    handedness: "right",
    appearanceSource: "auto",
    theme: getDefaultFretboardWoodThemeName("guitar"),
    inlayPreset: DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  };

export function getKeyboardInstrumentCreationConfig(
  selection: KeyboardInstrumentSelection,
): InstrumentCreationConfig<"keyboard"> {
  return {
    ...(selection.range === "custom"
      ? { config: { midiRange: selection.midiRange } }
      : { range: selection.range }),
    theme: selection.theme,
  };
}

export function getFretboardInstrumentCreationConfig(
  selection: FretboardInstrumentSelection,
): InstrumentCreationConfig<"fretboard"> {
  const inlayPresetConfig =
    selection.appearanceSource === "custom"
      ? fretboardInlayPresets[selection.inlayPreset].config
      : undefined;

  return {
    ...(selection.appearanceSource === "custom"
      ? { theme: selection.theme }
      : {}),
    config: {
      instrument: selection.instrument,
      tuningKey: selection.tuningKey,
      fretRange: [...selection.fretRange],
      leftHanded: selection.handedness === "left",
      ...(inlayPresetConfig ?? {}),
    },
  };
}

export function getInstrumentCreationConfig(
  instrumentType: InstrumentType,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
): InstrumentCreationConfig {
  return instrumentType === "keyboard"
    ? getKeyboardInstrumentCreationConfig(keyboardSelection)
    : getFretboardInstrumentCreationConfig(fretboardSelection);
}

export function getInstrumentPartModuleCreationConfig(
  instrumentType: InstrumentType,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
): PartModuleCreationConfig<"instrument"> {
  return {
    instrumentType,
    instrumentSettings: getInstrumentCreationConfig(
      instrumentType,
      keyboardSelection,
      fretboardSelection,
    ),
  };
}
