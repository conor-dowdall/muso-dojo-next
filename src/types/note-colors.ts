import { type ColorCollectionKey } from "@musodojo/music-theory-data";

export type NoteColorMode = "absolute" | "relative";
export type NoteColorSource = "theme" | "preset" | "custom";

export type NoteColorTuple<T = string | null> = readonly [
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
  T,
];

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
  colors: NoteColorTuple<string>;
}

export type WorkspaceNoteColorConfig =
  | ThemeNoteColorConfig
  | PresetNoteColorConfig
  | CustomNoteColorConfig;

export interface InstrumentNoteColor {
  index: number;
  value: string;
}
