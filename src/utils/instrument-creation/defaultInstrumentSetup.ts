import {
  stringInstruments,
  type StringInstrumentKey,
} from "@musodojo/music-theory-data";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import { DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET } from "@/data/fretboard/inlayPresets";
import {
  type FretboardCreationDefault,
  type InstrumentCreationDefault,
} from "@/types/instrument-creation-defaults";

export function createBuiltInDefaultInstrumentSetup(): InstrumentCreationDefault {
  const instrument = "guitar" satisfies StringInstrumentKey;

  return {
    instrumentType: "fretboard",
    setup: {
      instrument,
      tuningKey: stringInstruments[instrument].defaultTuning,
      handedness: "right",
      appearanceSource: "auto",
      theme: getDefaultFretboardWoodThemeName(instrument),
      inlayPreset: DEFAULT_CUSTOM_FRETBOARD_INLAY_PRESET,
    },
  };
}

export function fretboardCreationDefaultsAreEqual(
  left: FretboardCreationDefault,
  right: FretboardCreationDefault,
) {
  return (
    left.instrument === right.instrument &&
    left.tuningKey === right.tuningKey &&
    left.handedness === right.handedness &&
    left.appearanceSource === right.appearanceSource &&
    left.theme === right.theme &&
    left.inlayPreset === right.inlayPreset
  );
}

export function defaultInstrumentSetupsMatchRaw(
  left: InstrumentCreationDefault,
  right: InstrumentCreationDefault,
) {
  if (left.instrumentType !== right.instrumentType) {
    return false;
  }

  if (left.instrumentType === "keyboard") {
    return (
      right.instrumentType === "keyboard" &&
      left.setup.theme === right.setup.theme
    );
  }

  return (
    right.instrumentType === "fretboard" &&
    fretboardCreationDefaultsAreEqual(left.setup, right.setup)
  );
}

export function isBuiltInDefaultInstrumentSetup(
  value: InstrumentCreationDefault,
) {
  return defaultInstrumentSetupsMatchRaw(
    value,
    createBuiltInDefaultInstrumentSetup(),
  );
}
