import {
  colorCollections,
  normalizeHexColor as normalizeCoreHexColor,
  type ColorCollectionKey,
} from "@musodojo/music-theory-data";
import {
  createNoteColorTuple,
  defaultCustomNoteColors,
  NOTE_COLOR_INDEXES,
} from "@/data/noteColors";
import {
  type CustomNoteColorConfig,
  type NoteColorMode,
  type NoteColorTuple,
  type WorkspaceNoteColorConfig,
} from "@/types/note-colors";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function normalizeNoteColorMode(
  value: unknown,
): NoteColorMode | undefined {
  return value === "absolute" || value === "relative" ? value : undefined;
}

export function normalizeNoteColorPresetKey(
  value: unknown,
): ColorCollectionKey | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return value in colorCollections ? (value as ColorCollectionKey) : undefined;
}

export function normalizeHexColor(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return normalizeCoreHexColor(value) ?? undefined;
}

export function normalizeCustomNoteColors(
  value: unknown,
): NoteColorTuple<string> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const colors = NOTE_COLOR_INDEXES.map(
    (index) =>
      normalizeHexColor(value[index]) ?? defaultCustomNoteColors[index],
  );

  return createNoteColorTuple(colors);
}

export function createCustomNoteColorConfig(
  sourceConfig?: WorkspaceNoteColorConfig,
): CustomNoteColorConfig {
  if (sourceConfig?.source === "custom") {
    return sourceConfig;
  }

  if (sourceConfig?.source === "preset") {
    const collection = colorCollections[sourceConfig.preset];

    return {
      source: "custom",
      name: "Custom Colors",
      mode: collection.mode,
      colors: createNoteColorTuple(
        collection.colors.map(
          (color, index) =>
            normalizeHexColor(color) ?? defaultCustomNoteColors[index],
        ),
      ),
    };
  }

  return {
    source: "custom",
    name: "Custom Colors",
    mode: "absolute",
    colors: defaultCustomNoteColors,
  };
}

export function normalizeNoteColorConfig(
  value: unknown,
): WorkspaceNoteColorConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.source === "theme") {
    return { source: "theme" };
  }

  if (value.source === "preset") {
    const preset = normalizeNoteColorPresetKey(value.preset);

    return preset ? { source: "preset", preset } : undefined;
  }

  if (value.source === "custom") {
    return {
      source: "custom",
      name: normalizeString(value.name) ?? "Custom Colors",
      mode: normalizeNoteColorMode(value.mode) ?? "absolute",
      colors:
        normalizeCustomNoteColors(value.colors) ?? defaultCustomNoteColors,
    };
  }

  return undefined;
}
