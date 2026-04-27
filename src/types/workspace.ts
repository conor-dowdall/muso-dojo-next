import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type KeyboardRangeName } from "@/data/keyboard/ranges";
import { type KeyboardThemeName } from "@/data/keyboard/themes";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentLayoutConfig } from "@/types/instrument-layout";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type MusicGroupLayout } from "@/types/music-group";
import { type FretboardConfig } from "@/types/fretboard";
import { type KeyboardConfig } from "@/types/keyboard";
import { type DisplayFormatId } from "@/data/displayFormats";

export type InstrumentType = "fretboard" | "keyboard";

export interface InstrumentInstanceBaseConfig {
  id: string;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  displayFormatId?: DisplayFormatId;
  noteEmphasis?: InstrumentNoteEmphasis;
  activeNotes?: ActiveNotes;
  layout?: InstrumentLayoutConfig;
  showHeader?: boolean;
  showMidiNumbers?: boolean;
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

export type InstrumentInstanceConfig =
  | FretboardInstrumentInstanceConfig
  | KeyboardInstrumentInstanceConfig;

export type InstrumentCreationConfig<
  T extends InstrumentType = InstrumentType,
> = T extends "fretboard"
  ? Partial<Omit<FretboardInstrumentInstanceConfig, "id" | "type">>
  : Partial<Omit<KeyboardInstrumentInstanceConfig, "id" | "type">>;

export type AddInstrumentHandler = <T extends InstrumentType = "keyboard">(
  type?: T,
  settings?: InstrumentCreationConfig<T>,
) => string | undefined | void;

export interface MusicGroupConfig {
  id: string;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  accentColor?: string;
  layout?: MusicGroupLayout;
  showHeader?: boolean;
  instruments: InstrumentInstanceConfig[];
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  lastModified: string;
  groups: MusicGroupConfig[];
}

export interface AppStoreSnapshot {
  activeWorkspaceId: string;
  workspaces: Record<string, WorkspaceConfig>;
}
