import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type KeyboardRangeName } from "@/data/keyboard/ranges";
import { type KeyboardThemeName } from "@/data/keyboard/themes";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentLayoutConfig } from "@/types/instrument-layout";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { type MusicPartLayout } from "@/types/music-part";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import { type FretboardConfig } from "@/types/fretboard";
import { type KeyboardConfig } from "@/types/keyboard";
import { type DisplayFormatId } from "@/data/displayFormats";

export type ChordProgressionChordListMode =
  | "each-chord-once"
  | "full-song-order";

export interface InstrumentInstanceBaseConfig {
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

export interface PartModuleConfigByType {
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
  instrument: InstrumentPartModuleCreationConfig;
}

export type PartModuleCreationConfig<
  T extends PartModuleType = PartModuleType,
> = T extends PartModuleType ? PartModuleCreationConfigByType[T] : never;

export type PartModuleCreationRequest<
  T extends PartModuleType = PartModuleType,
> = T extends PartModuleType
  ? {
      moduleType: T;
      moduleSettings: PartModuleCreationConfig<T>;
    }
  : never;

export type AddPartModuleHandler = <T extends PartModuleType>(
  type: T,
  settings?: PartModuleCreationConfig<T>,
) => string | undefined | void;

export interface MusicPartConfig {
  id: string;
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  layout?: MusicPartLayout;
  showHeader?: boolean;
  modules: PartModuleConfig[];
}

export interface SessionConfig {
  id: string;
  name: string;
  lastModified: string;
  noteColorConfig?: SessionNoteColorConfig;
  parts: MusicPartConfig[];
}

export interface AppStoreSnapshot {
  activeSessionId: string | null;
  sessions: Record<string, SessionConfig>;
}
