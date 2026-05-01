import {
  isValidNoteCollectionKey,
  normalizeRootNoteString,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { isDisplayFormatId, type DisplayFormatId } from "@/data/displayFormats";
import { isInstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { normalizeActiveNotes } from "@/utils/instrument/createActiveNotesConfig";
import { normalizeInstrumentLayoutConfig } from "@/utils/instrument/createInstrumentLayoutConfig";
import {
  normalizeFretboardConfig,
  normalizeFretboardThemeName,
} from "@/utils/fretboard/createFretboardConfig";
import {
  normalizeKeyboardRange,
  normalizeKeyboardThemeName,
  normalizeKeyboardConfig,
} from "@/utils/keyboard/createKeyboardConfig";
import {
  type AppStoreSnapshot,
  type FretboardInstrumentInstanceConfig,
  type InstrumentInstanceBaseConfig,
  type InstrumentInstanceConfig,
  type InstrumentType,
  type KeyboardInstrumentInstanceConfig,
  type MusicGroupConfig,
  type WorkspaceConfig,
} from "@/types/workspace";
import { type MusicGroupLayout } from "@/types/music-group";
import { normalizeNoteColorConfig } from "@/utils/note-colors/createNoteColorConfig";

const DEFAULT_WORKSPACE_ID = "workspace-1";
const DEFAULT_WORKSPACE_NAME = "Practice Workspace";
const DEFAULT_GROUP_ROOT_NOTE = "C";
const DEFAULT_GROUP_NOTE_COLLECTION_KEY = "major";
const FALLBACK_LAST_MODIFIED = "1970-01-01T00:00:00.000Z";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function normalizeId(value: unknown, fallback: string): string {
  return normalizeString(value) ?? fallback;
}

function normalizeRootNote(
  value: unknown,
  fallback = DEFAULT_GROUP_ROOT_NOTE,
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return normalizeRootNoteString(value) ?? fallback;
}

function normalizeOptionalRootNote(value: unknown): string | undefined {
  return typeof value === "string" ? normalizeRootNoteString(value) : undefined;
}

function normalizeNoteCollectionKey(
  value: unknown,
  fallback: NoteCollectionKey = DEFAULT_GROUP_NOTE_COLLECTION_KEY,
): NoteCollectionKey {
  return typeof value === "string" && isValidNoteCollectionKey(value)
    ? value
    : fallback;
}

function normalizeOptionalNoteCollectionKey(
  value: unknown,
): NoteCollectionKey | undefined {
  return typeof value === "string" && isValidNoteCollectionKey(value)
    ? value
    : undefined;
}

function normalizeLayout(value: unknown): MusicGroupLayout | undefined {
  return value === "row" || value === "column" ? value : undefined;
}

function normalizeOptionalDisplayFormatId(
  value: unknown,
): DisplayFormatId | undefined {
  return isDisplayFormatId(value) && value !== "note-names" ? value : undefined;
}

function normalizeOptionalBoolean(
  value: unknown,
  defaultValue: boolean,
): boolean | undefined {
  return typeof value === "boolean" && value !== defaultValue
    ? value
    : undefined;
}

function normalizeInstrumentType(value: unknown): InstrumentType | undefined {
  return value === "fretboard" || value === "keyboard" ? value : undefined;
}

function normalizeInstrumentBaseConfig(
  input: Record<string, unknown>,
  id: string,
): InstrumentInstanceBaseConfig {
  const rootNote = normalizeOptionalRootNote(input.rootNote);
  const noteCollectionKey = normalizeOptionalNoteCollectionKey(
    input.noteCollectionKey,
  );
  const displayFormatId = normalizeOptionalDisplayFormatId(
    input.displayFormatId,
  );
  const noteEmphasis = isInstrumentNoteEmphasis(input.noteEmphasis)
    ? input.noteEmphasis
    : undefined;
  const activeNotes = normalizeActiveNotes(input.activeNotes);
  const layout = normalizeInstrumentLayoutConfig(input.layout);
  const showHeader = normalizeOptionalBoolean(input.showHeader, true);
  const showMidiNumbers = normalizeOptionalBoolean(
    input.showMidiNumbers,
    false,
  );

  return {
    id,
    ...(rootNote ? { rootNote } : {}),
    ...(noteCollectionKey ? { noteCollectionKey } : {}),
    ...(displayFormatId ? { displayFormatId } : {}),
    ...(noteEmphasis && noteEmphasis !== "large" ? { noteEmphasis } : {}),
    ...(activeNotes !== undefined ? { activeNotes } : {}),
    ...(layout ? { layout } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
    ...(showMidiNumbers !== undefined ? { showMidiNumbers } : {}),
  };
}

export function normalizeInstrumentInstanceConfig(
  value: unknown,
  index = 0,
): InstrumentInstanceConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const type = normalizeInstrumentType(value.type);
  if (!type) {
    return undefined;
  }

  const id = normalizeId(value.id, `${type}-${index + 1}`);
  const baseConfig = normalizeInstrumentBaseConfig(value, id);

  if (type === "fretboard") {
    const theme = normalizeFretboardThemeName(value.theme);
    const config = normalizeFretboardConfig(value.config, theme);

    return {
      ...baseConfig,
      type,
      ...(theme ? { theme } : {}),
      ...(config ? { config } : {}),
    } satisfies FretboardInstrumentInstanceConfig;
  }

  const range = normalizeKeyboardRange(value.range);
  const theme = normalizeKeyboardThemeName(value.theme);
  const config = normalizeKeyboardConfig(value.config, range, theme);

  return {
    ...baseConfig,
    type,
    ...(range ? { range } : {}),
    ...(theme ? { theme } : {}),
    ...(config ? { config } : {}),
  } satisfies KeyboardInstrumentInstanceConfig;
}

export function normalizeMusicGroupConfig(
  value: unknown,
  index = 0,
): MusicGroupConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const instruments = Array.isArray(value.instruments)
    ? value.instruments
        .map((instrument, instrumentIndex) =>
          normalizeInstrumentInstanceConfig(instrument, instrumentIndex),
        )
        .filter((instrument): instrument is InstrumentInstanceConfig =>
          Boolean(instrument),
        )
    : [];
  const layout = normalizeLayout(value.layout);
  const showHeader = normalizeOptionalBoolean(value.showHeader, true);

  return {
    id: normalizeId(value.id, `group-${index + 1}`),
    rootNote: normalizeRootNote(value.rootNote),
    noteCollectionKey: normalizeNoteCollectionKey(value.noteCollectionKey),
    ...(layout && layout !== "column" ? { layout } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
    instruments,
  };
}

export function normalizeWorkspaceConfig(value: unknown): WorkspaceConfig {
  const input = isRecord(value) ? value : {};
  const noteColorConfig = normalizeNoteColorConfig(input.noteColorConfig);
  const groups = Array.isArray(input.groups)
    ? input.groups
        .map((group, groupIndex) =>
          normalizeMusicGroupConfig(group, groupIndex),
        )
        .filter((group): group is MusicGroupConfig => Boolean(group))
    : [];

  return {
    id: normalizeId(input.id, DEFAULT_WORKSPACE_ID),
    name: normalizeString(input.name) ?? DEFAULT_WORKSPACE_NAME,
    lastModified: normalizeString(input.lastModified) ?? FALLBACK_LAST_MODIFIED,
    ...(noteColorConfig ? { noteColorConfig } : {}),
    groups,
  };
}

export function createAppStoreSnapshot(
  workspace: unknown,
  activeWorkspaceId?: string,
): AppStoreSnapshot {
  const normalizedWorkspace = normalizeWorkspaceConfig(workspace);
  const requestedActiveWorkspaceId = normalizeString(activeWorkspaceId);
  const normalizedActiveWorkspaceId =
    requestedActiveWorkspaceId === normalizedWorkspace.id
      ? requestedActiveWorkspaceId
      : normalizedWorkspace.id;

  return {
    activeWorkspaceId: normalizedActiveWorkspaceId,
    workspaces: {
      [normalizedWorkspace.id]: normalizedWorkspace,
    },
  };
}

export function normalizeAppStoreSnapshot(
  value: unknown,
  fallbackSnapshot = createAppStoreSnapshot({}),
): AppStoreSnapshot {
  if (!isRecord(value)) {
    return fallbackSnapshot;
  }

  const workspaceRecord = isRecord(value.workspaces)
    ? value.workspaces
    : undefined;
  const normalizedWorkspaces = workspaceRecord
    ? Object.values(workspaceRecord).map((workspace) =>
        normalizeWorkspaceConfig(workspace),
      )
    : [];
  const workspaces = workspaceRecord
    ? Object.fromEntries(
        normalizedWorkspaces.map((workspace) => [workspace.id, workspace]),
      )
    : fallbackSnapshot.workspaces;
  const requestedActiveWorkspaceId = normalizeString(value.activeWorkspaceId);
  const firstWorkspaceId = Object.keys(workspaces)[0];
  const activeWorkspaceId =
    requestedActiveWorkspaceId && workspaces[requestedActiveWorkspaceId]
      ? requestedActiveWorkspaceId
      : (firstWorkspaceId ?? null);

  return {
    activeWorkspaceId,
    workspaces,
  };
}
