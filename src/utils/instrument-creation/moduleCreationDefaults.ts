import {
  stringInstruments,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import { DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET } from "@/data/fretboard/inlayPresets";
import { DEFAULT_KEYBOARD_THEME } from "@/data/keyboard/themes";
import {
  type FretboardModuleCreationDefault,
  type KeyboardModuleCreationDefault,
  type ModuleCreationDefaults,
  type ModuleCreationKind,
} from "@/types/instrument-creation-defaults";
import { areRangesEqual } from "@/utils/range/numberRange";

export const DEFAULT_MODULE_CREATION_KINDS = [
  "fretboard",
] as const satisfies readonly ModuleCreationKind[];

export function createBuiltInFretboardModuleCreationDefault(): FretboardModuleCreationDefault {
  const instrument = "guitar" satisfies StringInstrumentKey;

  return {
    instrument,
    tuningKey: stringInstruments[instrument].defaultTuning,
    handedness: "right",
    appearanceSource: "auto",
    theme: getDefaultFretboardWoodThemeName(instrument),
    inlayPreset: DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
  };
}

export function createBuiltInKeyboardModuleCreationDefault(): KeyboardModuleCreationDefault {
  return {
    theme: DEFAULT_KEYBOARD_THEME,
  };
}

export function moduleCreationKindsAreEqual(
  left: readonly ModuleCreationKind[] | undefined,
  right: readonly ModuleCreationKind[] | undefined,
) {
  const resolvedLeft = left ?? DEFAULT_MODULE_CREATION_KINDS;
  const resolvedRight = right ?? DEFAULT_MODULE_CREATION_KINDS;

  return (
    resolvedLeft.length === resolvedRight.length &&
    resolvedLeft.every((kind, index) => kind === resolvedRight[index])
  );
}

function fretboardRangesAreEqual(
  left: FretboardModuleCreationDefault["range"],
  right: FretboardModuleCreationDefault["range"],
) {
  if (!left || !right) {
    return left === right;
  }

  return areRangesEqual(left.fretRange, right.fretRange);
}

export function fretboardModuleCreationDefaultsAreEqual(
  left: FretboardModuleCreationDefault,
  right: FretboardModuleCreationDefault,
) {
  return (
    left.instrument === right.instrument &&
    left.tuningKey === right.tuningKey &&
    left.handedness === right.handedness &&
    left.appearanceSource === right.appearanceSource &&
    left.theme === right.theme &&
    left.inlayPreset === right.inlayPreset &&
    fretboardRangesAreEqual(left.range, right.range)
  );
}

function keyboardRangesAreEqual(
  left: KeyboardModuleCreationDefault["range"],
  right: KeyboardModuleCreationDefault["range"],
) {
  if (!left || !right) {
    return left === right;
  }

  if (left.source !== right.source) {
    return false;
  }

  return left.source === "named"
    ? right.source === "named" && left.range === right.range
    : right.source === "custom" &&
        areRangesEqual(left.midiRange, right.midiRange);
}

export function keyboardModuleCreationDefaultsAreEqual(
  left: KeyboardModuleCreationDefault,
  right: KeyboardModuleCreationDefault,
) {
  return (
    left.theme === right.theme &&
    keyboardRangesAreEqual(left.range, right.range)
  );
}

export function moduleCreationDefaultsAreEqual(
  left: ModuleCreationDefaults | undefined,
  right: ModuleCreationDefaults | undefined,
) {
  if (!left || !right) {
    return left === right;
  }

  if (
    !moduleCreationKindsAreEqual(
      left.sessionModuleKinds,
      right.sessionModuleKinds,
    ) ||
    !moduleCreationKindsAreEqual(left.partModuleKinds, right.partModuleKinds)
  ) {
    return false;
  }

  if (!left.fretboard || !right.fretboard) {
    if (left.fretboard !== right.fretboard) {
      return false;
    }
  } else if (
    !fretboardModuleCreationDefaultsAreEqual(left.fretboard, right.fretboard)
  ) {
    return false;
  }

  if (!left.keyboard || !right.keyboard) {
    return left.keyboard === right.keyboard;
  }

  return keyboardModuleCreationDefaultsAreEqual(left.keyboard, right.keyboard);
}
