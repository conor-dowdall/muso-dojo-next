import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type StateCreator } from "zustand";
import { type AudioPresetId } from "@/audio/types";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import { type SettingValue } from "@/types/state";
import {
  type AppStoreSnapshot,
  type FretboardInstrumentInstanceConfig,
  type InstrumentInstanceBaseConfig,
  type KeyboardInstrumentInstanceConfig,
  type MusicPartConfig,
  type PartModuleCreationConfig,
  type PartModuleType,
  type SessionConfig,
} from "@/types/session";

export type InstrumentSettingsPatch = Partial<InstrumentInstanceBaseConfig> & {
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

export interface SessionActions {
  setActiveSessionId: (sessionId: string) => void;
  addSession: (settings?: { name?: string }) => string;
  importSession: (session: SessionConfig) => string;
  cloneSession: (sessionId: string) => string | undefined;
  removeSession: (sessionId: string) => void;
  renameSession: (sessionId: string, name: string) => void;
  setSessionNoteColorConfig: (
    sessionId: string,
    noteColorConfig: SessionNoteColorConfig,
  ) => void;
}

export interface PartActions {
  addPart: (
    sessionId?: string,
    settings?: {
      rootNote?: string;
      noteCollectionKey?: NoteCollectionKey;
      moduleType?: PartModuleType;
      moduleSettings?: PartModuleCreationConfig;
    },
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
  setInstrumentActiveNotes: (
    sessionId: string,
    partId: string,
    moduleId: string,
    activeNotes: SettingValue<ActiveNotes | undefined>,
  ) => void;
  setInstrumentActiveNotesLocked: (
    sessionId: string,
    partId: string,
    moduleId: string,
    activeNotesLocked: SettingValue<boolean>,
  ) => void;
}

export interface PartModuleActions {
  addPartModule: <T extends PartModuleType>(
    sessionId: string,
    partId: string,
    type: T,
    settings?: PartModuleCreationConfig<T>,
  ) => string | undefined;
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

export type AppStoreActions = SessionActions &
  PartActions &
  PartModuleActions &
  InstrumentActions;
export type AppStore = AppStoreSnapshot & AppStoreActions;
export type AppStoreSet = Parameters<StateCreator<AppStore>>[0];
export type AppStoreGet = Parameters<StateCreator<AppStore>>[1];
