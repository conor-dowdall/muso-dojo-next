import { stringInstruments } from "@musodojo/music-theory-data";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import {
  DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  fretboardInlayPresets,
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
import {
  type FretboardCreationAppearanceSource,
  type FretboardCreationDefault,
  type InstrumentCreationDefaults,
  type KeyboardCreationDefault,
} from "@/types/instrument-creation-defaults";

export type KeyboardRangeSelection = KeyboardRangeName | "custom";
export type InstrumentCreationViewportTier = "tiny" | "compact" | "regular";

export interface KeyboardInstrumentSelection {
  range: KeyboardRangeSelection;
  midiRange: readonly [number, number];
  theme: KeyboardThemeName;
}

export type FretboardAppearanceSource = FretboardCreationAppearanceSource;

export interface FretboardInstrumentSelection extends FretboardCreationDefault {
  fretRange: readonly [number, number];
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
  defaults?: InstrumentCreationDefaults,
): KeyboardInstrumentSelection {
  const range = keyboardRangeByTier[tier];

  return {
    range,
    midiRange: keyboardRanges[range].midiRange,
    theme: defaults?.keyboard?.theme ?? DEFAULT_KEYBOARD_THEME,
  };
}

export function createDefaultFretboardInstrumentSelection(
  tier: InstrumentCreationViewportTier = getInstrumentCreationViewportTier(),
  defaults?: InstrumentCreationDefaults,
): FretboardInstrumentSelection {
  const fretRange = fretRangeByTier[tier];
  const fretboardDefault = defaults?.fretboard;

  return {
    instrument: fretboardDefault?.instrument ?? "guitar",
    tuningKey:
      fretboardDefault?.tuningKey ?? stringInstruments.guitar.defaultTuning,
    fretRange: [...fretRange],
    handedness: fretboardDefault?.handedness ?? "right",
    appearanceSource: fretboardDefault?.appearanceSource ?? "auto",
    theme:
      fretboardDefault?.theme ??
      getDefaultFretboardWoodThemeName(
        fretboardDefault?.instrument ?? "guitar",
      ),
    inlayPreset:
      fretboardDefault?.inlayPreset ?? DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  };
}

export function createDefaultInstrumentSelections(
  tier: InstrumentCreationViewportTier = getInstrumentCreationViewportTier(),
  defaults?: InstrumentCreationDefaults,
) {
  return {
    keyboardSelection: createDefaultKeyboardInstrumentSelection(tier, defaults),
    fretboardSelection: createDefaultFretboardInstrumentSelection(
      tier,
      defaults,
    ),
  };
}

export function getKeyboardCreationDefault(
  selection: KeyboardInstrumentSelection,
): KeyboardCreationDefault {
  return {
    theme: selection.theme,
  };
}

export function getFretboardCreationDefault(
  selection: FretboardInstrumentSelection,
): FretboardCreationDefault {
  return {
    instrument: selection.instrument,
    tuningKey: selection.tuningKey,
    handedness: selection.handedness,
    appearanceSource: selection.appearanceSource,
    theme: selection.theme,
    inlayPreset: selection.inlayPreset,
  };
}

export function getInstrumentCreationDefault(
  instrumentType: InstrumentType,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
) {
  return instrumentType === "keyboard"
    ? getKeyboardCreationDefault(keyboardSelection)
    : getFretboardCreationDefault(fretboardSelection);
}

export function instrumentCreationDefaultMatchesSelection(
  instrumentType: InstrumentType,
  defaults: InstrumentCreationDefaults | undefined,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
) {
  if (instrumentType === "keyboard") {
    return defaults?.keyboard?.theme === keyboardSelection.theme;
  }

  const fretboardDefault = defaults?.fretboard;

  if (!fretboardDefault) {
    return false;
  }

  return (
    fretboardDefault.instrument === fretboardSelection.instrument &&
    fretboardDefault.tuningKey === fretboardSelection.tuningKey &&
    fretboardDefault.handedness === fretboardSelection.handedness &&
    fretboardDefault.appearanceSource === fretboardSelection.appearanceSource &&
    fretboardDefault.theme === fretboardSelection.theme &&
    fretboardDefault.inlayPreset === fretboardSelection.inlayPreset
  );
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
