import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type AudioPresetId, type MasterAmbiencePresetId } from "@/audio/types";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type KeyboardRangeName } from "@/data/keyboard/ranges";
import { type KeyboardThemeName } from "@/data/keyboard/themes";
import {
  type ActiveNotes,
  type ActiveNotesSourceKey,
} from "@/types/instrument-active-note";
import { type InstrumentLayoutConfig } from "@/types/instrument-layout";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type InstrumentCreationDefault } from "@/types/instrument-creation-defaults";
import { type NoteColorConfig } from "@/types/note-colors";
import { type FretboardConfig } from "@/types/fretboard";
import { type KeyboardConfig } from "@/types/keyboard";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type AppThemeName } from "@/data/appThemes";

export type ChordProgressionChordListMode =
  | "each-chord-once"
  | "full-song-order";

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
  type: "drone";
  audioPresetId?: AudioPresetId;
  octave?: number;
}

export interface PartModuleConfigByType {
  drone: DronePartModuleConfig;
  instrument: InstrumentPartModuleConfig;
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
  drone: Partial<Omit<DronePartModuleConfig, "id" | "type">>;
  instrument: InstrumentPartModuleCreationConfig;
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
  initialModule?: PartModuleCreationRequest;
}

export type AddPartModuleHandler = <T extends PartModuleType>(
  request: PartModuleCreationRequest<T>,
) => string | undefined | void;

export interface MusicPartConfig {
  id: string;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  showHeader?: boolean;
  /**
   * Part modules consume the shared part context. Practice modules such as
   * Drone should follow rootNote unless they explicitly introduce an override.
   */
  modules: PartModuleConfig[];
}

export interface SessionConfig {
  id: string;
  name: string;
  lastModified: string;
  parts: MusicPartConfig[];
}

/**
 * Dojo-level settings apply across sessions. Keep musical workspace data in
 * SessionConfig, content structure in MusicPartConfig/PartModuleConfig, and
 * instrument behavior in InstrumentInstanceConfig.
 */
export interface DojoSettings {
  appTheme?: AppThemeName;
  noteColorConfig?: NoteColorConfig;
  defaultInstrumentSetup?: InstrumentCreationDefault;
  masterAmbiencePresetId?: MasterAmbiencePresetId;
}

export interface AppStoreSnapshot {
  activeSessionId: string | null;
  dojoSettings: DojoSettings;
  sessions: Record<string, SessionConfig>;
}
