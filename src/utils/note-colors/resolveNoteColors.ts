import {
  colorCollections,
  getNoteColorIndex as getCoreNoteColorIndex,
  normalizeChromaticIndex,
  normalizeRootNoteString,
  rootNoteToIntegerMap,
} from "@musodojo/music-theory-data";
import {
  DEFAULT_NOTE_COLOR_CONFIG,
  DEFAULT_NOTE_COLOR_PRESET,
  NOTE_COLOR_INDEXES,
  NOTE_COLOR_NEUTRAL_VALUE,
  NOTE_COLOR_THEME_VALUE,
  createNoteColorTuple,
  getDefaultNoteColorValue,
} from "@/data/noteColors";
import {
  type InstrumentNoteColor,
  type NoteColorMode,
  type NoteColorSource,
  type NoteColorTuple,
  type NoteColorConfig,
} from "@/types/note-colors";

export interface ResolvedNoteColors {
  source: NoteColorSource;
  mode: NoteColorMode;
  colors: NoteColorTuple<string>;
}

function resolvePresetNoteColors(config: NoteColorConfig): ResolvedNoteColors {
  const preset =
    config.source === "preset" ? config.preset : DEFAULT_NOTE_COLOR_PRESET;
  const collection = colorCollections[preset];

  return {
    source: "preset",
    mode: collection.mode,
    colors: createNoteColorTuple(
      collection.colors.map((color) => color ?? NOTE_COLOR_NEUTRAL_VALUE),
    ),
  };
}

export function resolveNoteColors(
  config: NoteColorConfig | undefined,
): ResolvedNoteColors {
  if (config?.source === "theme") {
    return {
      source: "theme",
      mode: "absolute",
      colors: createNoteColorTuple(
        NOTE_COLOR_INDEXES.map(() => NOTE_COLOR_THEME_VALUE),
      ),
    };
  }

  if (config?.source === "custom") {
    return {
      source: "custom",
      mode: config.mode,
      colors: createNoteColorTuple(
        config.colors.map((color) => color ?? NOTE_COLOR_NEUTRAL_VALUE),
      ),
    };
  }

  if (config === undefined) {
    return resolveNoteColors(DEFAULT_NOTE_COLOR_CONFIG);
  }

  return resolvePresetNoteColors(config);
}

export function createNoteColorStyle(
  colors: NoteColorTuple<string>,
): Record<string, string> {
  return Object.fromEntries(
    NOTE_COLOR_INDEXES.map((index) => [
      `--dojo-note-color-${index}`,
      colors[index],
    ]),
  );
}

export function getNoteColorIndex(
  midi: number,
  rootNote: string | undefined,
  mode: NoteColorMode,
) {
  const normalizedRootNote =
    rootNote !== undefined ? normalizeRootNoteString(rootNote) : undefined;
  const rootPitchClass = normalizedRootNote
    ? rootNoteToIntegerMap.get(normalizedRootNote)
    : undefined;

  return getCoreNoteColorIndex({
    midi: Math.trunc(midi),
    mode,
    rootPitchClass,
  });
}

export function getDojoNoteColorVariable(index: number) {
  const colorIndex = normalizeChromaticIndex(Math.trunc(index));

  return `var(--dojo-note-color-${colorIndex}, ${getDefaultNoteColorValue(colorIndex)})`;
}

export function resolveInstrumentNoteColor({
  midi,
  mode,
  rootNote,
}: {
  midi: number;
  mode: NoteColorMode;
  rootNote?: string;
}): InstrumentNoteColor {
  const index = getNoteColorIndex(midi, rootNote, mode);

  return {
    index,
    value: getDojoNoteColorVariable(index),
  };
}
