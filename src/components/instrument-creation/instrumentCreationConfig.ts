import { stringInstruments } from "@musodojo/music-theory-data";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import { DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET } from "@/data/fretboard/inlayPresets";
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
  type KeyboardCreationDefault,
  type FretboardModuleCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationDefaults,
  type ModuleCreationKind,
} from "@/types/instrument-creation-defaults";
import { getModuleCreationKindsForContext } from "@/utils/instrument-creation/moduleCreationDefaults";

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

// Instrument ranges are intentionally local setup, not remembered defaults:
// creation starts from nearby same-type instruments, then falls back to viewport.
export interface InstrumentCreationRangeContext {
  fretboard?: Pick<FretboardInstrumentSelection, "fretRange">;
  keyboard?: Pick<KeyboardInstrumentSelection, "midiRange" | "range">;
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

function isInstrumentModuleCreationKind(
  moduleKind: ModuleCreationKind,
): moduleKind is InstrumentType {
  return moduleKind === "fretboard" || moduleKind === "keyboard";
}

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
  moduleCreationDefaults?: ModuleCreationDefaults,
  rangeContext?: InstrumentCreationRangeContext,
): KeyboardInstrumentSelection {
  const contextKeyboard = rangeContext?.keyboard;
  const responsiveRange = keyboardRangeByTier[tier];
  const keyboardDefault = moduleCreationDefaults?.keyboard;
  const rememberedRange = keyboardDefault?.range;
  const range =
    contextKeyboard?.range ??
    (rememberedRange?.source === "named"
      ? rememberedRange.range
      : rememberedRange?.source === "custom"
        ? "custom"
        : responsiveRange);
  const midiRange =
    contextKeyboard?.midiRange ??
    (rememberedRange?.source === "custom"
      ? rememberedRange.midiRange
      : keyboardRanges[range === "custom" ? responsiveRange : range].midiRange);

  return {
    range,
    midiRange: [midiRange[0], midiRange[1]],
    theme: keyboardDefault?.theme ?? DEFAULT_KEYBOARD_THEME,
  };
}

export function createDefaultFretboardInstrumentSelection(
  tier: InstrumentCreationViewportTier = getInstrumentCreationViewportTier(),
  moduleCreationDefaults?: ModuleCreationDefaults,
  rangeContext?: InstrumentCreationRangeContext,
): FretboardInstrumentSelection {
  const fretboardDefault = moduleCreationDefaults?.fretboard;
  const fretRange =
    rangeContext?.fretboard?.fretRange ??
    fretboardDefault?.range?.fretRange ??
    fretRangeByTier[tier];

  return {
    instrument: fretboardDefault?.instrument ?? "guitar",
    ...(fretboardDefault?.tuning
      ? {
          tuning: [...fretboardDefault.tuning],
          ...(fretboardDefault.tuningName
            ? { tuningName: fretboardDefault.tuningName }
            : {}),
        }
      : {
          tuningKey:
            fretboardDefault?.tuningKey ??
            stringInstruments.guitar.defaultTuning,
        }),
    fretRange: [fretRange[0], fretRange[1]],
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
  moduleCreationDefaults?: ModuleCreationDefaults,
  rangeContext?: InstrumentCreationRangeContext,
) {
  return {
    keyboardSelection: createDefaultKeyboardInstrumentSelection(
      tier,
      moduleCreationDefaults,
      rangeContext,
    ),
    fretboardSelection: createDefaultFretboardInstrumentSelection(
      tier,
      moduleCreationDefaults,
      rangeContext,
    ),
  };
}

export function getDefaultInstrumentType(
  moduleCreationDefaults: ModuleCreationDefaults | undefined,
): InstrumentType {
  const moduleKinds = getModuleCreationKindsForContext(
    moduleCreationDefaults,
    "session",
  );
  const firstInstrumentKind = moduleKinds?.find(isInstrumentModuleCreationKind);

  return firstInstrumentKind ?? "fretboard";
}

export function getKeyboardCreationDefault(
  selection: KeyboardInstrumentSelection,
): KeyboardCreationDefault {
  return {
    theme: selection.theme,
  };
}

export function getKeyboardModuleCreationDefault(
  selection: KeyboardInstrumentSelection,
  options: { includeRange?: boolean } = {},
): KeyboardModuleCreationDefault {
  return {
    ...getKeyboardCreationDefault(selection),
    ...(options.includeRange
      ? {
          range:
            selection.range === "custom"
              ? {
                  source: "custom",
                  midiRange: [selection.midiRange[0], selection.midiRange[1]],
                }
              : {
                  source: "named",
                  range: selection.range,
                },
        }
      : {}),
  };
}

export function getFretboardCreationDefault(
  selection: FretboardInstrumentSelection,
): FretboardCreationDefault {
  return {
    instrument: selection.instrument,
    ...(selection.tuning
      ? {
          tuning: [...selection.tuning],
          ...(selection.tuningName ? { tuningName: selection.tuningName } : {}),
        }
      : { tuningKey: selection.tuningKey }),
    handedness: selection.handedness,
    appearanceSource: selection.appearanceSource,
    theme: selection.theme,
    inlayPreset: selection.inlayPreset,
  };
}

export function getFretboardModuleCreationDefault(
  selection: FretboardInstrumentSelection,
  options: { includeRange?: boolean } = {},
): FretboardModuleCreationDefault {
  return {
    ...getFretboardCreationDefault(selection),
    ...(options.includeRange
      ? {
          range: {
            source: "custom",
            fretRange: [selection.fretRange[0], selection.fretRange[1]],
          },
        }
      : {}),
  };
}

export function getInstrumentModuleCreationDefault(
  instrumentType: InstrumentType,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
  options: { includeRange?: boolean } = {},
): FretboardModuleCreationDefault | KeyboardModuleCreationDefault {
  return instrumentType === "keyboard"
    ? getKeyboardModuleCreationDefault(keyboardSelection, options)
    : getFretboardModuleCreationDefault(fretboardSelection, options);
}

export function instrumentCreationDefaultMatchesSelection(
  instrumentType: InstrumentType,
  moduleCreationDefaults: ModuleCreationDefaults | undefined,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
) {
  if (instrumentType === "keyboard") {
    const keyboardDefault = moduleCreationDefaults?.keyboard;

    return (
      keyboardDefault !== undefined &&
      keyboardDefault.theme === keyboardSelection.theme
    );
  }

  const fretboardDefault = moduleCreationDefaults?.fretboard;

  if (!fretboardDefault) {
    return false;
  }

  return (
    fretboardDefault.instrument === fretboardSelection.instrument &&
    fretboardDefault.tuningKey === fretboardSelection.tuningKey &&
    fretboardDefault.tuningName === fretboardSelection.tuningName &&
    (fretboardDefault.tuning === undefined &&
    fretboardSelection.tuning === undefined
      ? true
      : fretboardDefault.tuning?.length === fretboardSelection.tuning?.length &&
        fretboardDefault.tuning?.every(
          (note, index) => note === fretboardSelection.tuning?.[index],
        )) &&
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
  return {
    ...(selection.appearanceSource === "custom"
      ? {
          inlayPreset: selection.inlayPreset,
          theme: selection.theme,
        }
      : {}),
    config: {
      instrument: selection.instrument,
      ...(selection.tuning
        ? {
            tuning: [...selection.tuning],
            ...(selection.tuningName
              ? { tuningName: selection.tuningName }
              : {}),
          }
        : { tuningKey: selection.tuningKey }),
      fretRange: [...selection.fretRange],
      leftHanded: selection.handedness === "left",
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
