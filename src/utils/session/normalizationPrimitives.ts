import {
  noteCollection,
  normalizeRootNoteString,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function normalizeId(value: unknown, fallback: string): string {
  return normalizeString(value) ?? fallback;
}

function reserveUniqueId(preferredId: string, usedIds: Set<string>) {
  const baseId = preferredId.trim() || "item";

  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  const copyBase = baseId.replace(/-copy(?:-\d+)?$/, "");
  let copyIndex = 1;
  let nextId = `${copyBase}-copy`;

  while (usedIds.has(nextId)) {
    copyIndex += 1;
    nextId = `${copyBase}-copy-${copyIndex}`;
  }

  usedIds.add(nextId);
  return nextId;
}

export function ensureUniqueIds<T extends { id: string }>(configs: T[]): T[] {
  const usedIds = new Set<string>();
  let changed = false;
  const uniqueConfigs = configs.map((config) => {
    const id = reserveUniqueId(config.id, usedIds);

    if (id === config.id) {
      return config;
    }

    changed = true;
    return {
      ...config,
      id,
    } as T;
  });

  return changed ? uniqueConfigs : configs;
}

export function normalizeRootNote(
  value: unknown,
  fallback = DEFAULT_PART_ROOT_NOTE,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return normalizeRootNoteString(value) ?? fallback;
}

export function normalizeOptionalRootNote(
  value: unknown,
): RootNote | undefined {
  return typeof value === "string" ? normalizeRootNoteString(value) : undefined;
}

export function normalizeNoteCollectionKey(
  value: unknown,
  fallback: NoteCollectionKey = DEFAULT_PART_NOTE_COLLECTION_KEY,
): NoteCollectionKey {
  return typeof value === "string" && noteCollection.isValidKey(value)
    ? value
    : fallback;
}

export function normalizeOptionalNoteCollectionKey(
  value: unknown,
): NoteCollectionKey | undefined {
  return typeof value === "string" && noteCollection.isValidKey(value)
    ? value
    : undefined;
}

export function normalizeOptionalBoolean(
  value: unknown,
  defaultValue: boolean,
): boolean | undefined {
  return typeof value === "boolean" && value !== defaultValue
    ? value
    : undefined;
}
