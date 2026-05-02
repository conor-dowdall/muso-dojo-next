import {
  type ChromaticIndex,
  type ChromaticTuple,
  type ColorCollectionKey,
  type NoteColorMode,
} from "@musodojo/music-theory-data";

export type NoteColorSource = "theme" | "preset" | "custom";

export type { NoteColorMode };

export type NoteColorTuple<T = string | null> = ChromaticTuple<T>;

export interface ThemeNoteColorConfig {
  source: "theme";
}

export interface PresetNoteColorConfig {
  source: "preset";
  preset: ColorCollectionKey;
}

export interface CustomNoteColorConfig {
  source: "custom";
  name: string;
  mode: NoteColorMode;
  colors: NoteColorTuple<string | null>;
}

export type WorkspaceNoteColorConfig =
  | ThemeNoteColorConfig
  | PresetNoteColorConfig
  | CustomNoteColorConfig;

export interface InstrumentNoteColor {
  index: ChromaticIndex;
  value: string;
}
