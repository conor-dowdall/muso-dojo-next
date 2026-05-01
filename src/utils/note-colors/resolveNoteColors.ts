import {
  colorCollections,
  getNoteColorIndex as getCoreNoteColorIndex,
  normalizeChromaticIndex,
  normalizeRootNoteString,
  rootNoteToIntegerMap,
} from "@musodojo/music-theory-data";
import {
  DEFAULT_NOTE_COLOR_CONFIG,
  NOTE_COLOR_INDEXES,
  NOTE_COLOR_NEUTRAL_VALUE,
  NOTE_COLOR_THEME_VALUE,
  createNoteColorTuple,
} from "@/data/noteColors";
import {
  type InstrumentNoteColor,
  type NoteColorMode,
  type NoteColorSource,
  type NoteColorTuple,
  type WorkspaceNoteColorConfig,
} from "@/types/note-colors";

export interface ResolvedWorkspaceNoteColors {
  source: NoteColorSource;
  mode: NoteColorMode;
  colors: NoteColorTuple<string>;
}

function resolvePresetNoteColors(
  config: WorkspaceNoteColorConfig,
): ResolvedWorkspaceNoteColors {
  const preset =
    config.source === "preset"
      ? config.preset
      : DEFAULT_NOTE_COLOR_CONFIG.preset;
  const collection = colorCollections[preset];

  return {
    source: "preset",
    mode: collection.mode,
    colors: createNoteColorTuple(
      collection.colors.map((color) => color ?? NOTE_COLOR_NEUTRAL_VALUE),
    ),
  };
}

export function resolveWorkspaceNoteColors(
  config: WorkspaceNoteColorConfig | undefined,
): ResolvedWorkspaceNoteColors {
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
      colors: config.colors,
    };
  }

  return resolvePresetNoteColors(config ?? DEFAULT_NOTE_COLOR_CONFIG);
}

export function createWorkspaceNoteColorStyle(
  colors: NoteColorTuple<string>,
): Record<string, string> {
  return Object.fromEntries(
    NOTE_COLOR_INDEXES.map((index) => [
      `--workspace-note-color-${index}`,
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

export function getWorkspaceNoteColorVariable(index: number) {
  const colorIndex = normalizeChromaticIndex(Math.trunc(index));

  return `var(--workspace-note-color-${colorIndex}, var(--pitch-${colorIndex}))`;
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
    value: getWorkspaceNoteColorVariable(index),
  };
}
