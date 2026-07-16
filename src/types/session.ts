import {
  type ChordProgressionKey,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { type AudioPresetId } from "@/audio/types";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type FretboardInlayPresetName } from "@/data/fretboard/inlayPresets";
import { type KeyboardRangeName } from "@/data/keyboard/ranges";
import { type KeyboardThemeName } from "@/data/keyboard/themes";
import {
  type ActiveNotes,
  type ActiveNotesSourceKey,
} from "@/types/instrument-active-note";
import { type InstrumentLayoutConfig } from "@/types/instrument-layout";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type ModuleCreationDefaults } from "@/types/instrument-creation-defaults";
import { type NoteColorConfig } from "@/types/note-colors";
import { type FretboardConfig } from "@/types/fretboard";
import { type KeyboardConfig } from "@/types/keyboard";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type AppThemeName } from "@/data/appThemes";
import { type SavedFretboardTuning } from "@/types/custom-fretboard-tuning";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
import {
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import { type BeatSubdivisionId } from "@/utils/music-theory/beatSubdivision";
import { type RhythmSelection } from "@/utils/rhythm/rhythmConfig";
import { type SessionWorkspaceViewMode } from "@/types/session-view";

export type ChordProgressionChordListMode =
  "each-chord-once" | "full-song-order";

export type SessionMaterialCreationKind = "part" | "chord-progression";

export type AutomaticRhythmStyle = "standard" | "swing";

export interface AutomaticRhythmConfig {
  style: AutomaticRhythmStyle;
}

/** Authored harmonic identity retained while a generated progression Part is edited. */
export interface AuthoredChordProgressionConfig {
  kind: "chord-progression";
  noteCollectionKey: NoteCollectionKey;
  progressionInstanceId: string;
  progressionKey: ChordProgressionKey;
  romanSymbol: string;
  rootNote: string;
  tonalCenter: RootNote;
}

export type PartBandSourceConfig =
  { mode: "session" } | { mode: "off" } | { mode: "module"; moduleId: string };

export interface PartBandConfig {
  backingNotes: PartBandSourceConfig;
  rhythm: PartBandSourceConfig;
}

export type SessionBackingBandRhythmMode = "automatic" | "custom" | "off";

export interface SessionBackingBandConfig {
  countInBeats: number;
  looper: {
    audioPresetId: AudioPresetId;
    enabled: boolean;
    octaveOffset: number;
  };
  rhythm: {
    mode: SessionBackingBandRhythmMode;
    selection: RhythmSelection;
  };
}

export type PartBandRole = keyof PartBandConfig;

export interface SessionMaterialCreationDefaults {
  chordListMode?: ChordProgressionChordListMode;
  materialKind?: SessionMaterialCreationKind;
  noteCollectionKey?: NoteCollectionKey;
  progressionKey?: ChordProgressionKey;
  rootNote?: RootNote;
}

export type RememberSessionMaterialCreationRequest =
  SessionMaterialCreationDefaults;

export interface InstrumentInstanceBaseConfig {
  audioPresetId?: AudioPresetId;
  displayFormatId?: DisplayFormatId;
  noteEmphasis?: InstrumentNoteEmphasis;
  activeNotes?: ActiveNotes;
  activeNotesLocked?: boolean;
  activeNotesLockSourceKey?: ActiveNotesSourceKey;
  layout?: InstrumentLayoutConfig;
  showHeader?: boolean;
}

export interface FretboardInstrumentInstanceConfig extends InstrumentInstanceBaseConfig {
  inlayPreset?: FretboardInlayPresetName;
  type: "fretboard";
  theme?: FretboardThemeName;
  config?: FretboardConfig;
}

export interface KeyboardInstrumentInstanceConfig extends InstrumentInstanceBaseConfig {
  type: "keyboard";
  range?: KeyboardRangeName;
  theme?: KeyboardThemeName;
  config?: KeyboardConfig;
}

export interface InstrumentInstanceConfigByType {
  fretboard: FretboardInstrumentInstanceConfig;
  keyboard: KeyboardInstrumentInstanceConfig;
}

export type InstrumentType = keyof InstrumentInstanceConfigByType;
export type InstrumentInstanceConfig =
  InstrumentInstanceConfigByType[InstrumentType];

export type InstrumentCreationConfig<
  T extends InstrumentType = InstrumentType,
> = T extends InstrumentType
  ? Partial<Omit<InstrumentInstanceConfigByType[T], "type">>
  : never;

export interface PartModuleBaseConfig<TType extends string = string> {
  id: string;
  type: TType;
}

export interface InstrumentPartModuleConfig extends PartModuleBaseConfig<"instrument"> {
  type: "instrument";
  instrument: InstrumentInstanceConfig;
}

export interface DronePartModuleConfig extends PartModuleBaseConfig<"drone"> {
  audioPresetId?: AudioPresetId;
  noteCount?: number;
  octaveOffset?: number;
  type: "drone";
  wood?: WoodSurfaceId;
}

export type ExerciseSubdivision = BeatSubdivisionId;

export type ExerciseCountInBeats = 0 | 2 | 3 | 4;

export interface ExerciseLooperPartModuleConfig extends PartModuleBaseConfig<"exercise-looper"> {
  audioPresetId?: AudioPresetId;
  countInBeats?: ExerciseCountInBeats;
  end?: CollectionRangeBoundary;
  metronomeEnabled?: boolean;
  octaveOffset?: number;
  pattern?: ExercisePattern;
  start?: CollectionRangeBoundary;
  subdivision?: ExerciseSubdivision;
  type: "exercise-looper";
  wood?: WoodSurfaceId;
}

export interface RhythmPartModuleConfig extends PartModuleBaseConfig<"rhythm"> {
  /** Full-bar source retained while generated progression segments remain unchanged. */
  authoredBarRhythm?: RhythmSelection;
  rhythm: RhythmSelection;
  type: "rhythm";
  wood?: WoodSurfaceId;
}

export interface PartModuleConfigByType {
  drone: DronePartModuleConfig;
  "exercise-looper": ExerciseLooperPartModuleConfig;
  instrument: InstrumentPartModuleConfig;
  rhythm: RhythmPartModuleConfig;
}

export type PartModuleType = keyof PartModuleConfigByType;
export type PartModuleConfig = PartModuleConfigByType[PartModuleType];

export interface InstrumentPartModuleCreationConfig<
  T extends InstrumentType = InstrumentType,
> {
  instrumentType: T;
  instrumentSettings?: InstrumentCreationConfig<T>;
}

export interface PartModuleCreationConfigByType {
  drone: {
    octaveOffset?: number;
    wood?: WoodSurfaceId;
  };
  "exercise-looper": {
    audioPresetId?: AudioPresetId;
    octaveOffset?: number;
    wood?: WoodSurfaceId;
  };
  instrument: InstrumentPartModuleCreationConfig;
  rhythm: {
    rhythm?: RhythmSelection;
    wood?: WoodSurfaceId;
  };
}

export type PartModuleCreationConfig<
  T extends PartModuleType = PartModuleType,
> = T extends PartModuleType ? PartModuleCreationConfigByType[T] : never;

/**
 * Keep the module type and its creation settings in the same object at
 * boundary APIs. This prevents an instrument request being paired with Drone
 * or Looper settings as PartModuleType grows.
 */
export type PartModuleCreationRequest<
  T extends PartModuleType = PartModuleType,
> = T extends PartModuleType
  ? {
      type: T;
      settings?: PartModuleCreationConfig<T>;
    }
  : never;

export interface MusicPartCreationRequest {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  durationInBars?: number;
  band?: PartBandConfig;
  automaticRhythm?: AutomaticRhythmConfig;
  moduleRequests?: PartModuleCreationRequest[];
}

export type AddPartModuleHandler = <T extends PartModuleType>(
  request: PartModuleCreationRequest<T>,
) => string | undefined | void;

export type AddPartModulesHandler = (
  requests: PartModuleCreationRequest[],
) => string[] | undefined | void;

export interface MusicPartConfig {
  id: string;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  /** Optional source analysis for a Part generated in full progression order. */
  authoredProgression?: AuthoredChordProgressionConfig;
  /** Explicit source selection for each Practice Band role. */
  band?: PartBandConfig;
  /** Fallback feel used when no Rhythm module owns the band. */
  automaticRhythm?: AutomaticRhythmConfig;
  /**
   * Optional authored chart duration. It determines automatic Rhythm length;
   * ordinary Parts without an authored duration use four beats.
   */
  durationInBars?: number;
  showHeader?: boolean;
  /**
   * Part modules consume the shared part context. Practice modules such as
   * Drone should follow rootNote unless they explicitly introduce an override.
   */
  modules: PartModuleConfig[];
}

export interface SessionConfig {
  backingBand?: SessionBackingBandConfig;
  id: string;
  name: string;
  lastModified: string;
  parts: MusicPartConfig[];
  tempoBpm?: number;
}

/**
 * Dojo-level settings apply across sessions. Keep musical workspace data in
 * SessionConfig, content structure in MusicPartConfig/PartModuleConfig, and
 * instrument behavior in InstrumentInstanceConfig.
 */
export interface DojoSettings {
  appTheme?: AppThemeName;
  customFretboardTunings?: SavedFretboardTuning[];
  noteColorConfig?: NoteColorConfig;
  moduleCreationDefaults?: ModuleCreationDefaults;
  sessionMaterialCreationDefaults?: SessionMaterialCreationDefaults;
}

export interface AppStoreSnapshot {
  activeSessionId: string | null;
  dojoSettings: DojoSettings;
  sessionWorkspaceViewMode: SessionWorkspaceViewMode;
  sessions: Record<string, SessionConfig>;
}
