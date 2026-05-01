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
import { type WorkspaceNoteColorConfig } from "@/types/note-colors";

export const NOTE_COLOR_COUNT = CHROMATIC_NOTE_COUNT;
export const NOTE_COLOR_INDEXES = CHROMATIC_INDEXES;
export type NoteColorIndex = ChromaticIndex;

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

export const createNoteColorTuple = createChromaticTuple;

export const defaultCustomNoteColors = createNoteColorTuple(
  colorCollections[DEFAULT_NOTE_COLOR_PRESET].colors.map(
    (color) => color ?? NOTE_COLOR_NEUTRAL_VALUE,
  ),
);

export function getNoteColorLabel(mode: NoteColorMode, index: number) {
  const labels =
    noteLabelCollections[getDefaultNoteColorLabelCollectionKey(mode)].labels;
  const normalizedIndex = normalizeChromaticIndex(Math.trunc(index));

  return labels[normalizedIndex];
}
