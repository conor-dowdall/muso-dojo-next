import {
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { type CustomFretboardInlayPresetName } from "@/data/fretboard/inlayPresets";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type KeyboardThemeName } from "@/data/keyboard/themes";

export type FretboardCreationAppearanceSource = "auto" | "custom";

export interface FretboardCreationDefault {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  handedness: "right" | "left";
  appearanceSource: FretboardCreationAppearanceSource;
  theme: FretboardThemeName;
  inlayPreset: CustomFretboardInlayPresetName;
}

export interface KeyboardCreationDefault {
  theme: KeyboardThemeName;
}

export type InstrumentCreationDefault =
  | {
      instrumentType: "fretboard";
      setup: FretboardCreationDefault;
    }
  | {
      instrumentType: "keyboard";
      setup: KeyboardCreationDefault;
    };
