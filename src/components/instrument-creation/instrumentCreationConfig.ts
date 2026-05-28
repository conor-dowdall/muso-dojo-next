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
export type InstrumentCreationViewportTier = "tiny" | "compact" | "regular";

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

export const instrumentCreationViewportBreakpoints = {
  tinyMaxRem: 30,
  compactMaxRem: 64,
} as const;

const keyboardRangeByTier = {
  tiny: "keys13",
  compact: DEFAULT_KEYBOARD_RANGE,
  regular: "keys37",
} as const satisfies Record<InstrumentCreationViewportTier, KeyboardRangeName>;

const fretRangeByTier = {
  tiny: [0, 5],
  compact: [0, 9],
  regular: [0, 12],
} as const satisfies Record<
  InstrumentCreationViewportTier,
  readonly [number, number]
>;

function getRootFontSizePx() {
  if (typeof window === "undefined") {
    return 16;
  }

  const fontSize = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  );

  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 16;
}

function getViewportWidthPx() {
  return typeof window === "undefined" ? undefined : window.innerWidth;
}

export function getInstrumentCreationViewportTier(
  viewportWidthPx = getViewportWidthPx(),
  rootFontSizePx = getRootFontSizePx(),
): InstrumentCreationViewportTier {
  if (viewportWidthPx === undefined) {
    return "regular";
  }

  const widthRem = viewportWidthPx / rootFontSizePx;

  if (widthRem < instrumentCreationViewportBreakpoints.tinyMaxRem) {
    return "tiny";
  }

  if (widthRem < instrumentCreationViewportBreakpoints.compactMaxRem) {
    return "compact";
  }

  return "regular";
}

export function createDefaultKeyboardInstrumentSelection(
  tier: InstrumentCreationViewportTier = getInstrumentCreationViewportTier(),
): KeyboardInstrumentSelection {
  const range = keyboardRangeByTier[tier];

  return {
    range,
    midiRange: keyboardRanges[range].midiRange,
    theme: DEFAULT_KEYBOARD_THEME,
  };
}

export function createDefaultFretboardInstrumentSelection(
  tier: InstrumentCreationViewportTier = getInstrumentCreationViewportTier(),
): FretboardInstrumentSelection {
  const fretRange = fretRangeByTier[tier];

  return {
    instrument: "guitar",
    tuningKey: stringInstruments.guitar.defaultTuning,
    fretRange: [...fretRange],
    handedness: "right",
    appearanceSource: "auto",
    theme: getDefaultFretboardWoodThemeName("guitar"),
    inlayPreset: DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  };
}

export function createDefaultInstrumentSelections(
  tier: InstrumentCreationViewportTier = getInstrumentCreationViewportTier(),
) {
  return {
    keyboardSelection: createDefaultKeyboardInstrumentSelection(tier),
    fretboardSelection: createDefaultFretboardInstrumentSelection(tier),
  };
}

export const defaultKeyboardInstrumentSelection =
  createDefaultKeyboardInstrumentSelection("regular");

export const defaultFretboardInstrumentSelection =
  createDefaultFretboardInstrumentSelection("regular");

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
