import {
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { type CustomFretboardInlayPresetName } from "@/data/fretboard/inlayPresets";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type KeyboardRangeName } from "@/data/keyboard/ranges";
import { type KeyboardThemeName } from "@/data/keyboard/themes";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
import { type RhythmSelection } from "@/utils/rhythm/rhythmConfig";

export type FretboardCreationAppearanceSource = "auto" | "custom";
export type ModuleCreationKind =
  "fretboard" | "keyboard" | "drone" | "exercise-looper" | "rhythm";
export type ModuleCreationContext = "session" | "part";
export type ModuleCreationKindDefaults = Partial<
  Record<ModuleCreationContext, ModuleCreationKind[]>
>;

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

export interface DroneModuleCreationDefault {
  octaveOffset?: number;
  wood?: WoodSurfaceId;
}

export interface ExerciseLooperModuleCreationDefault {
  octaveOffset?: number;
  wood?: WoodSurfaceId;
}

export interface RhythmModuleCreationDefault {
  rhythm?: RhythmSelection;
  wood?: WoodSurfaceId;
}

export interface FretboardCreationRangeDefault {
  source: "custom";
  fretRange: [number, number];
}

export type KeyboardCreationRangeDefault =
  | {
      source: "named";
      range: KeyboardRangeName;
    }
  | {
      source: "custom";
      midiRange: [number, number];
    };

export interface FretboardModuleCreationDefault extends FretboardCreationDefault {
  range?: FretboardCreationRangeDefault;
}

export interface KeyboardModuleCreationDefault extends KeyboardCreationDefault {
  range?: KeyboardCreationRangeDefault;
}

export interface ModuleCreationDefaults {
  moduleKindDefaults?: ModuleCreationKindDefaults;
  drone?: DroneModuleCreationDefault;
  exerciseLooper?: ExerciseLooperModuleCreationDefault;
  fretboard?: FretboardModuleCreationDefault;
  keyboard?: KeyboardModuleCreationDefault;
  rhythm?: RhythmModuleCreationDefault;
}

export interface RememberModuleCreationRequest {
  context: ModuleCreationContext;
  moduleKinds: ModuleCreationKind[];
  drone?: DroneModuleCreationDefault;
  exerciseLooper?: ExerciseLooperModuleCreationDefault;
  fretboard?: FretboardModuleCreationDefault;
  keyboard?: KeyboardModuleCreationDefault;
  rhythm?: RhythmModuleCreationDefault;
}
