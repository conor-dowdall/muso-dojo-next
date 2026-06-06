import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type StateCreator } from "zustand";
import { type AudioPresetId, type MasterAmbiencePresetId } from "@/audio/types";
import { type AppThemeChoice } from "@/data/appThemes";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type FretboardInlayPresetName } from "@/data/fretboard/inlayPresets";
import { type RememberModuleCreationRequest } from "@/types/instrument-creation-defaults";
import {
  type ActiveNotes,
  type ActiveNotesLockSnapshot,
  type ActiveNotesSourceKey,
} from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type InstrumentSize } from "@/types/instrument-layout";
import { type NoteColorConfig } from "@/types/note-colors";
import { type SettingValue } from "@/types/state";
import {
  type AppStoreSnapshot,
  type DronePartModuleConfig,
  type FretboardInstrumentInstanceConfig,
  type InstrumentInstanceBaseConfig,
  type KeyboardInstrumentInstanceConfig,
  type MusicPartCreationRequest,
  type MusicPartConfig,
  type PartModuleCreationRequest,
  type PartModuleType,
  type RememberSessionMaterialCreationRequest,
  type SessionConfig,
} from "@/types/session";

export type InstrumentSettingsPatch = Partial<InstrumentInstanceBaseConfig> & {
  inlayPreset?: FretboardInlayPresetName;
  theme?:
    | FretboardInstrumentInstanceConfig["theme"]
    | KeyboardInstrumentInstanceConfig["theme"];
  range?: KeyboardInstrumentInstanceConfig["range"];
  config?:
    | FretboardInstrumentInstanceConfig["config"]
    | KeyboardInstrumentInstanceConfig["config"];
};

export type PartSettingsPatch = Partial<
  Omit<MusicPartConfig, "id" | "modules">
>;

export type DroneSettingsPatch = Partial<
  Omit<DronePartModuleConfig, "id" | "type">
>;

export interface DojoSettingsActions {
  setAppTheme: (theme: AppThemeChoice) => void;
  setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => void;
  setNoteColorConfig: (noteColorConfig: NoteColorConfig) => void;
  rememberModuleCreation: (request: RememberModuleCreationRequest) => void;
  rememberSessionMaterialCreation: (
    request: RememberSessionMaterialCreationRequest,
  ) => void;
}

export interface SessionActions {
  setActiveSessionId: (sessionId: string) => void;
  addSession: (settings?: { name?: string }) => string;
  importSession: (session: SessionConfig) => string;
  cloneSession: (sessionId: string) => string | undefined;
  removeSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
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
}

export interface InstrumentActions {
  updateInstrumentSettings: (
    sessionId: string,
    partId: string,
    moduleId: string,
    patch: InstrumentSettingsPatch,
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
  setDroneOctaveRowCount: (
    sessionId: string,
    partId: string,
    moduleId: string,
    octaveRowCount: SettingValue<number>,
  ) => void;
  setDroneWood: (
    sessionId: string,
    partId: string,
    moduleId: string,
    wood: SettingValue<WoodSurfaceId>,
  ) => void;
}

// Action slices follow the product hierarchy: Dojo -> Session -> Part ->
// Module -> Instrument.
export type AppStoreActions = DojoSettingsActions &
  SessionActions &
  PartActions &
  PartModuleActions &
  DroneActions &
  InstrumentActions;
export type AppStore = AppStoreSnapshot & AppStoreActions;
export type AppStoreSet = Parameters<StateCreator<AppStore>>[0];
export type AppStoreGet = Parameters<StateCreator<AppStore>>[1];
