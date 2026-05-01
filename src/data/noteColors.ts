import {
  colorCollections,
  type ColorCollectionKey,
} from "@musodojo/music-theory-data";
import {
  type NoteColorMode,
  type NoteColorTuple,
  type WorkspaceNoteColorConfig,
} from "@/types/note-colors";

export const NOTE_COLOR_COUNT = 12;
export const NOTE_COLOR_INDEXES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
] as const;
export type NoteColorIndex = (typeof NOTE_COLOR_INDEXES)[number];

export const DEFAULT_NOTE_COLOR_PRESET =
  "musoDojo" satisfies ColorCollectionKey;

export const DEFAULT_NOTE_COLOR_CONFIG = {
  source: "preset",
  preset: DEFAULT_NOTE_COLOR_PRESET,
} as const satisfies WorkspaceNoteColorConfig;

export const NOTE_COLOR_THEME_VALUE = "var(--note-color-theme)";
export const NOTE_COLOR_NEUTRAL_VALUE = "var(--note-color-neutral)";

export const noteColorPresetKeys = Object.keys(
  colorCollections,
) as ColorCollectionKey[];

export const noteColorAbsoluteLabels = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const satisfies NoteColorTuple<string>;

export const noteColorRelativeLabels = [
  "Root",
  "b2",
  "2",
  "b3",
  "3",
  "4",
  "b5",
  "5",
  "b6",
  "6",
  "b7",
  "7",
] as const satisfies NoteColorTuple<string>;

export function createNoteColorTuple<T>(
  values: readonly T[],
): NoteColorTuple<T> {
  if (values.length < NOTE_COLOR_COUNT) {
    throw new Error("Expected 12 note colors");
  }

  return NOTE_COLOR_INDEXES.map(
    (index) => values[index],
  ) as unknown as NoteColorTuple<T>;
}

export const defaultCustomNoteColors = createNoteColorTuple(
  colorCollections[DEFAULT_NOTE_COLOR_PRESET].colors.map(
    (color) => color ?? NOTE_COLOR_NEUTRAL_VALUE,
  ),
);

export function getNoteColorLabel(mode: NoteColorMode, index: number) {
  const labels =
    mode === "relative" ? noteColorRelativeLabels : noteColorAbsoluteLabels;
  const normalizedIndex =
    ((Math.trunc(index) % NOTE_COLOR_COUNT) + NOTE_COLOR_COUNT) %
    NOTE_COLOR_COUNT;

  return labels[normalizedIndex as NoteColorIndex];
}
