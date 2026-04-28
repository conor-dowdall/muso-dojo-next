import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { DEFAULT_FRETBOARD_THEME } from "@/data/fretboard/themes";
import { DEFAULT_KEYBOARD_THEME } from "@/data/keyboard/themes";
import {
  type InstrumentCreationConfig,
  type InstrumentInstanceConfig,
  type InstrumentType,
  type MusicGroupConfig,
  type WorkspaceConfig,
} from "@/types/workspace";
import {
  normalizeInstrumentInstanceConfig,
  normalizeMusicGroupConfig,
  normalizeWorkspaceConfig,
} from "@/utils/workspace/createWorkspaceConfig";

const DEFAULT_GROUP_ROOT_NOTE = "C";
const DEFAULT_GROUP_NOTE_COLLECTION_KEY = "major";
const DEFAULT_WORKSPACE_NAME = "Practice Workspace";
const FALLBACK_WORKSPACE_ID = "workspace-1";
const FALLBACK_GROUP_ID = "group-1";
const FALLBACK_LAST_MODIFIED = "1970-01-01T00:00:00.000Z";

interface CreateMusicGroupConfigOptions {
  id?: string;
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
  instrumentType?: InstrumentType;
}

interface CreateWorkspaceConfigOptions {
  id?: string;
  name?: string;
  lastModified?: string;
  groupId?: string;
}

export function createEntityId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${suffix}`;
}

export function createDefaultInstrumentConfig(
  type: InstrumentType = "keyboard",
  settings: InstrumentCreationConfig = {},
): InstrumentInstanceConfig {
  const instrument = normalizeInstrumentInstanceConfig({
    id: createEntityId(type),
    type,
    ...(type === "fretboard" ? { theme: DEFAULT_FRETBOARD_THEME } : {}),
    ...(type === "keyboard" ? { theme: DEFAULT_KEYBOARD_THEME } : {}),
    ...settings,
  });

  if (!instrument) {
    throw new Error(`Unable to create default ${type} instrument`);
  }

  return instrument;
}

export function createDefaultMusicGroupConfig({
  id = createEntityId("group"),
  rootNote = DEFAULT_GROUP_ROOT_NOTE,
  noteCollectionKey = DEFAULT_GROUP_NOTE_COLLECTION_KEY,
  instrumentType,
}: CreateMusicGroupConfigOptions = {}): MusicGroupConfig {
  const group = normalizeMusicGroupConfig({
    id,
    rootNote,
    noteCollectionKey,
    instruments: instrumentType
      ? [createDefaultInstrumentConfig(instrumentType)]
      : [],
  });

  if (!group) {
    throw new Error("Unable to create default music group");
  }

  return group;
}

export function createDefaultWorkspaceConfig({
  id = createEntityId("workspace"),
  name = DEFAULT_WORKSPACE_NAME,
  lastModified = new Date().toISOString(),
  groupId,
}: CreateWorkspaceConfigOptions = {}): WorkspaceConfig {
  return normalizeWorkspaceConfig({
    id,
    name,
    lastModified,
    groups: [createDefaultMusicGroupConfig({ id: groupId })],
  });
}

export function createFallbackWorkspaceConfig(): WorkspaceConfig {
  return createDefaultWorkspaceConfig({
    id: FALLBACK_WORKSPACE_ID,
    name: DEFAULT_WORKSPACE_NAME,
    lastModified: FALLBACK_LAST_MODIFIED,
    groupId: FALLBACK_GROUP_ID,
  });
}
