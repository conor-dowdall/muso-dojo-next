import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type StateCreator } from "zustand";
import { type AudioPresetId } from "@/audio/types";
import { type AppThemeChoice } from "@/data/appThemes";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type RememberModuleCreationRequest } from "@/types/instrument-creation-defaults";
import { type SavedFretboardTuningInput } from "@/types/custom-fretboard-tuning";
import { type SavedChordProgressionInput } from "@/types/custom-chord-progression";
import {
  type ActiveNotes,
  type ActiveNotesLockSnapshot,
  type ActiveNotesSourceKey,
} from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type InstrumentSize } from "@/types/instrument-layout";
import { type NoteColorConfig } from "@/types/note-colors";
import { type SettingValue } from "@/types/state";
import { type SessionWorkspaceViewMode } from "@/types/session-view";
import {
  type ActiveWorkspaceRef,
  type ArrangementPlaybackMode,
} from "@/types/arrangement";
import {
  type AppStoreSnapshot,
  type DronePartModuleConfig,
  type ExerciseCountInBeats,
  type ExerciseLooperPartModuleConfig,
  type ExerciseSubdivision,
  type FretboardInstrumentInstanceConfig,
  type KeyboardInstrumentInstanceConfig,
  type MusicPartCreationRequest,
  type MusicPartConfig,
  type PartModuleCreationRequest,
  type PartBandRole,
  type PartBandSourceConfig,
  type PartModuleType,
  type RememberSessionMaterialCreationRequest,
  type RhythmPartModuleConfig,
  type SessionConfig,
  type SessionBackingBandConfig,
} from "@/types/session";
import { type RhythmRecipe } from "@/utils/rhythm/rhythmConfig";
import {
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";

export type FretboardInstrumentSettingsPatch = Partial<
  Omit<FretboardInstrumentInstanceConfig, "type">
>;

export type KeyboardInstrumentSettingsPatch = Partial<
  Omit<KeyboardInstrumentInstanceConfig, "type">
>;

export type PartSettingsPatch = Partial<
  Omit<MusicPartConfig, "id" | "modules">
>;

export type DroneSettingsPatch = Partial<
  Omit<DronePartModuleConfig, "id" | "type">
>;

export type ExerciseLooperSettingsPatch = Partial<
  Omit<ExerciseLooperPartModuleConfig, "id" | "type">
>;

export type RhythmSettingsPatch = Partial<
  Omit<RhythmPartModuleConfig, "id" | "type">
>;

export interface DojoSettingsActions {
  addCustomChordProgression: (
    progression: SavedChordProgressionInput,
  ) => string | undefined;
  updateCustomChordProgression: (
    progressionId: string,
    progression: SavedChordProgressionInput,
  ) => boolean;
  removeCustomChordProgression: (progressionId: string) => void;
  addCustomFretboardTuning: (
    tuning: SavedFretboardTuningInput,
  ) => string | undefined;
  updateCustomFretboardTuning: (
    tuningId: string,
    tuning: SavedFretboardTuningInput,
  ) => void;
  removeCustomFretboardTuning: (tuningId: string) => void;
  setAppTheme: (theme: AppThemeChoice) => void;
  setNoteColorConfig: (noteColorConfig: NoteColorConfig) => void;
  rememberModuleCreation: (request: RememberModuleCreationRequest) => void;
  rememberSessionMaterialCreation: (
    request: RememberSessionMaterialCreationRequest,
  ) => void;
}

export interface WorkspaceActions {
  setActiveWorkspace: (workspace: ActiveWorkspaceRef) => void;
  setSessionWorkspaceViewMode: (
    mode: SessionWorkspaceViewMode,
  ) => SessionWorkspaceViewMode;
}

export interface ArrangementActions {
  addArrangement: (settings?: { name?: string }) => string;
  cloneArrangement: (arrangementId: string) => string | undefined;
  removeArrangement: (arrangementId: string) => void;
  renameArrangement: (arrangementId: string, name: string) => void;
  setArrangementTempoBpm: (arrangementId: string, tempoBpm: number) => void;
  setArrangementPlaybackMode: (
    arrangementId: string,
    mode: ArrangementPlaybackMode,
  ) => void;
  addArrangementSectionFromSession: (
    arrangementId: string,
    sessionId: string,
  ) => { sectionId: string; entryId: string } | undefined;
  appendArrangementSectionEntry: (
    arrangementId: string,
    sectionId: string,
  ) => string | undefined;
  replaceArrangementSectionFromSession: (
    arrangementId: string,
    sectionId: string,
    sessionId: string,
  ) => boolean;
  renameArrangementSection: (
    arrangementId: string,
    sectionId: string,
    name: string,
  ) => void;
  moveArrangementEntry: (
    arrangementId: string,
    entryId: string,
    direction: "earlier" | "later",
  ) => void;
  cloneArrangementEntry: (
    arrangementId: string,
    entryId: string,
  ) => string | undefined;
  setArrangementEntryPlayCount: (
    arrangementId: string,
    entryId: string,
    playCount: number,
  ) => void;
  removeArrangementEntry: (arrangementId: string, entryId: string) => void;
}

export interface SessionActions {
  setActiveSessionId: (sessionId: string) => void;
  addSession: (settings?: { name?: string }) => string;
  importSession: (session: SessionConfig) => string;
  cloneSession: (sessionId: string) => string | undefined;
  removeSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  setSessionTempoBpm: (sessionId: string, tempoBpm: number) => void;
  setSessionBackingBand: (
    sessionId: string,
    backingBand: SessionBackingBandConfig,
  ) => void;
}

export interface PartActions {
  addPart: (
    sessionId?: string,
    settings?: MusicPartCreationRequest,
  ) => string | undefined;
  addParts: (
    sessionId: string | undefined,
    parts: MusicPartConfig[],
  ) => string[];
  replaceParts: (
    sessionId: string | undefined,
    parts: MusicPartConfig[],
  ) => string[];
  updatePartSettings: (
    sessionId: string,
    partId: string,
    patch: PartSettingsPatch,
  ) => void;
  clonePart: (sessionId: string, partId: string) => string | undefined;
  removePart: (sessionId: string, partId: string) => void;
  setPartRootNote: (
    sessionId: string,
    partId: string,
    rootNote: SettingValue<string>,
  ) => void;
  setPartNoteCollectionKey: (
    sessionId: string,
    partId: string,
    noteCollectionKey: SettingValue<NoteCollectionKey>,
  ) => void;
  setPartBandSource: (
    sessionId: string,
    partId: string,
    role: PartBandRole,
    source: PartBandSourceConfig,
  ) => void;
}

export interface InstrumentActions {
  updateFretboardInstrumentSettings: (
    sessionId: string,
    partId: string,
    moduleId: string,
    patch: FretboardInstrumentSettingsPatch,
  ) => void;
  updateKeyboardInstrumentSettings: (
    sessionId: string,
    partId: string,
    moduleId: string,
    patch: KeyboardInstrumentSettingsPatch,
  ) => void;
  setInstrumentDisplayFormatId: (
    sessionId: string,
    partId: string,
    moduleId: string,
    displayFormatId: SettingValue<DisplayFormatId>,
  ) => void;
  setInstrumentNoteEmphasis: (
    sessionId: string,
    partId: string,
    moduleId: string,
    noteEmphasis: SettingValue<InstrumentNoteEmphasis>,
  ) => void;
  setInstrumentAudioPresetId: (
    sessionId: string,
    partId: string,
    moduleId: string,
    audioPresetId: SettingValue<AudioPresetId>,
  ) => void;
  setInstrumentDisplaySize: (
    sessionId: string,
    partId: string,
    moduleId: string,
    size: SettingValue<InstrumentSize>,
  ) => void;
  setInstrumentActiveNotes: (
    sessionId: string,
    partId: string,
    moduleId: string,
    activeNotes: SettingValue<ActiveNotes | undefined>,
  ) => void;
  setInstrumentActiveNotesLock: (
    sessionId: string,
    partId: string,
    moduleId: string,
    activeNotesLocked: boolean,
    activeNotesLockSnapshot?: ActiveNotesLockSnapshot,
    activeNotesSourceKey?: ActiveNotesSourceKey,
  ) => void;
}

export interface PartModuleActions {
  addPartModule: <T extends PartModuleType>(
    sessionId: string,
    partId: string,
    request: PartModuleCreationRequest<T>,
  ) => string | undefined;
  addPartModules: (
    sessionId: string,
    partId: string,
    requests: PartModuleCreationRequest[],
  ) => string[];
  clonePartModule: (
    sessionId: string,
    partId: string,
    moduleId: string,
  ) => string | undefined;
  removePartModule: (
    sessionId: string,
    partId: string,
    moduleId: string,
  ) => void;
}

export interface DroneActions {
  updateDroneSettings: (
    sessionId: string,
    partId: string,
    moduleId: string,
    patch: DroneSettingsPatch,
  ) => void;
  setDroneAudioPresetId: (
    sessionId: string,
    partId: string,
    moduleId: string,
    audioPresetId: SettingValue<AudioPresetId>,
  ) => void;
  setDroneOctaveOffset: (
    sessionId: string,
    partId: string,
    moduleId: string,
    octaveOffset: SettingValue<number>,
  ) => void;
  setDroneNoteCount: (
    sessionId: string,
    partId: string,
    moduleId: string,
    noteCount: SettingValue<number>,
  ) => void;
  setDroneWood: (
    sessionId: string,
    partId: string,
    moduleId: string,
    wood: SettingValue<WoodSurfaceId>,
  ) => void;
}

export interface ExerciseLooperActions {
  updateExerciseLooperSettings: (
    sessionId: string,
    partId: string,
    moduleId: string,
    patch: ExerciseLooperSettingsPatch,
  ) => void;
  setExerciseLooperAudioPresetId: (
    sessionId: string,
    partId: string,
    moduleId: string,
    audioPresetId: SettingValue<AudioPresetId>,
  ) => void;
  setExerciseLooperCountInBeats: (
    sessionId: string,
    partId: string,
    moduleId: string,
    countInBeats: SettingValue<ExerciseCountInBeats>,
  ) => void;
  setExerciseLooperEnd: (
    sessionId: string,
    partId: string,
    moduleId: string,
    end: SettingValue<CollectionRangeBoundary>,
  ) => void;
  setExerciseLooperMetronomeEnabled: (
    sessionId: string,
    partId: string,
    moduleId: string,
    metronomeEnabled: SettingValue<boolean>,
  ) => void;
  setExerciseLooperOctaveOffset: (
    sessionId: string,
    partId: string,
    moduleId: string,
    octaveOffset: SettingValue<number>,
  ) => void;
  setExerciseLooperPattern: (
    sessionId: string,
    partId: string,
    moduleId: string,
    pattern: SettingValue<ExercisePattern>,
  ) => void;
  setExerciseLooperStart: (
    sessionId: string,
    partId: string,
    moduleId: string,
    start: SettingValue<CollectionRangeBoundary>,
  ) => void;
  setExerciseLooperSubdivision: (
    sessionId: string,
    partId: string,
    moduleId: string,
    subdivision: SettingValue<ExerciseSubdivision>,
  ) => void;
  setExerciseLooperWood: (
    sessionId: string,
    partId: string,
    moduleId: string,
    wood: SettingValue<WoodSurfaceId>,
  ) => void;
}

export interface RhythmActions {
  updateRhythmSettings: (
    sessionId: string,
    partId: string,
    moduleId: string,
    patch: RhythmSettingsPatch,
  ) => void;
  setRhythmRecipe: (
    sessionId: string,
    partId: string,
    moduleId: string,
    recipe: SettingValue<RhythmRecipe>,
  ) => void;
  setRhythmWood: (
    sessionId: string,
    partId: string,
    moduleId: string,
    wood: SettingValue<WoodSurfaceId>,
  ) => void;
}

// Action slices follow the product hierarchy: Dojo -> Session -> Part ->
// Module -> Instrument.
export type AppStoreActions = DojoSettingsActions &
  WorkspaceActions &
  ArrangementActions &
  SessionActions &
  PartActions &
  PartModuleActions &
  DroneActions &
  ExerciseLooperActions &
  RhythmActions &
  InstrumentActions;
export type AppStore = AppStoreSnapshot & AppStoreActions;
export type AppStoreSet = Parameters<StateCreator<AppStore>>[0];
export type AppStoreGet = Parameters<StateCreator<AppStore>>[1];
