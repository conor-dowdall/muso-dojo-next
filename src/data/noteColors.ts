import {
  CHROMATIC_INDEXES,
  CHROMATIC_NOTE_COUNT,
  colorCollections,
  createChromaticTuple,
  getDefaultNoteColorLabelCollectionKey,
  normalizeChromaticIndex,
  noteLabelCollections,
  type ChromaticIndex,
  type ColorCollectionKey,
  type NoteColorMode,
} from "@musodojo/music-theory-data";
import { type SessionNoteColorConfig } from "@/types/note-colors";

export const NOTE_COLOR_COUNT = CHROMATIC_NOTE_COUNT;
export const NOTE_COLOR_INDEXES = CHROMATIC_INDEXES;
export type NoteColorIndex = ChromaticIndex;

export const DEFAULT_NOTE_COLOR_PRESET =
  "musoDojo" satisfies ColorCollectionKey;

export const DEFAULT_NOTE_COLOR_CONFIG = {
  source: "theme",
} as const satisfies SessionNoteColorConfig;

export const NOTE_COLOR_THEME_VALUE = "var(--note-color-theme)";
export const NOTE_COLOR_NEUTRAL_VALUE = "var(--note-color-neutral)";

export const noteColorPresetKeys = Object.keys(
  colorCollections,
) as ColorCollectionKey[];

export const createNoteColorTuple = createChromaticTuple;

export const DEFAULT_NOTE_COLOR_VALUES = createNoteColorTuple(
  colorCollections[DEFAULT_NOTE_COLOR_PRESET].colors.map(
    (color) => color ?? NOTE_COLOR_NEUTRAL_VALUE,
  ),
);

export const defaultCustomNoteColors = DEFAULT_NOTE_COLOR_VALUES;

export function getDefaultNoteColorValue(index: number) {
  return DEFAULT_NOTE_COLOR_VALUES[normalizeChromaticIndex(Math.trunc(index))];
}

export function getNoteColorLabel(mode: NoteColorMode, index: number) {
  const labels =
    noteLabelCollections[getDefaultNoteColorLabelCollectionKey(mode)].labels;
  const normalizedIndex = normalizeChromaticIndex(Math.trunc(index));

  return labels[normalizedIndex];
}
