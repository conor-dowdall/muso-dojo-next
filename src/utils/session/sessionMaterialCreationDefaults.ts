import {
  noteCollection,
  normalizeRootNoteString,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  type ChordProgressionChordListMode,
  type SessionMaterialCreationDefaults,
  type SessionMaterialCreationKind,
} from "@/types/session";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";
import {
  normalizeAppChordProgressionKey,
  type AppChordProgressionKey,
} from "@/utils/music-theory/appChordProgressions";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DEFAULT_SESSION_MATERIAL_CREATION_KIND =
  "part" satisfies SessionMaterialCreationKind;
export const DEFAULT_SESSION_MATERIAL_CREATION_PROGRESSION_KEY =
  "oneOneFiveFive" satisfies AppChordProgressionKey;
export const DEFAULT_SESSION_MATERIAL_CREATION_CHORD_LIST_MODE =
  "full-song-order" satisfies ChordProgressionChordListMode;

const SESSION_MATERIAL_CREATION_KINDS = {
  "chord-progression": true,
  part: true,
} as const satisfies Record<SessionMaterialCreationKind, true>;

const CHORD_LIST_MODES = {
  "each-chord-once": true,
  "full-song-order": true,
} as const satisfies Record<ChordProgressionChordListMode, true>;

export function createBuiltInSessionMaterialCreationDefaults(): Required<SessionMaterialCreationDefaults> {
  return {
    chordListMode: DEFAULT_SESSION_MATERIAL_CREATION_CHORD_LIST_MODE,
    materialKind: DEFAULT_SESSION_MATERIAL_CREATION_KIND,
    noteCollectionKey: DEFAULT_PART_NOTE_COLLECTION_KEY,
    progressionKey: DEFAULT_SESSION_MATERIAL_CREATION_PROGRESSION_KEY,
    rootNote: DEFAULT_PART_ROOT_NOTE,
  };
}

function normalizeSessionMaterialCreationKind(
  value: unknown,
): SessionMaterialCreationKind | undefined {
  return typeof value === "string" && value in SESSION_MATERIAL_CREATION_KINDS
    ? (value as SessionMaterialCreationKind)
    : undefined;
}

function normalizeSessionMaterialRootNote(
  value: unknown,
): RootNote | undefined {
  return typeof value === "string"
    ? (normalizeRootNoteString(value) ?? undefined)
    : undefined;
}

function normalizeSessionMaterialNoteCollectionKey(value: unknown) {
  return typeof value === "string" && noteCollection.isValidKey(value)
    ? value
    : undefined;
}

function normalizeSessionMaterialProgressionKey(value: unknown) {
  return typeof value === "string"
    ? normalizeAppChordProgressionKey(value)
    : undefined;
}

function normalizeSessionMaterialChordListMode(
  value: unknown,
): ChordProgressionChordListMode | undefined {
  return typeof value === "string" && value in CHORD_LIST_MODES
    ? (value as ChordProgressionChordListMode)
    : undefined;
}

export function normalizeSessionMaterialCreationDefaults(
  value: unknown,
): SessionMaterialCreationDefaults | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const builtInDefaults = createBuiltInSessionMaterialCreationDefaults();
  const materialKind = normalizeSessionMaterialCreationKind(value.materialKind);
  const rootNote = normalizeSessionMaterialRootNote(value.rootNote);
  const noteCollectionKey = normalizeSessionMaterialNoteCollectionKey(
    value.noteCollectionKey,
  );
  const progressionKey = normalizeSessionMaterialProgressionKey(
    value.progressionKey,
  );
  const chordListMode = normalizeSessionMaterialChordListMode(
    value.chordListMode,
  );
  const defaults = {
    ...(chordListMode && chordListMode !== builtInDefaults.chordListMode
      ? { chordListMode }
      : {}),
    ...(materialKind && materialKind !== builtInDefaults.materialKind
      ? { materialKind }
      : {}),
    ...(noteCollectionKey &&
    noteCollectionKey !== builtInDefaults.noteCollectionKey
      ? { noteCollectionKey }
      : {}),
    ...(progressionKey && progressionKey !== builtInDefaults.progressionKey
      ? { progressionKey }
      : {}),
    ...(rootNote && rootNote !== builtInDefaults.rootNote ? { rootNote } : {}),
  } satisfies SessionMaterialCreationDefaults;

  return Object.keys(defaults).length === 0 ? undefined : defaults;
}

function resolveSessionMaterialCreationDefaults(
  value: SessionMaterialCreationDefaults | undefined,
) {
  return {
    ...createBuiltInSessionMaterialCreationDefaults(),
    ...normalizeSessionMaterialCreationDefaults(value),
  };
}

export function sessionMaterialCreationDefaultsAreEqual(
  left: SessionMaterialCreationDefaults | undefined,
  right: SessionMaterialCreationDefaults | undefined,
) {
  const resolvedLeft = resolveSessionMaterialCreationDefaults(left);
  const resolvedRight = resolveSessionMaterialCreationDefaults(right);

  return (
    resolvedLeft.chordListMode === resolvedRight.chordListMode &&
    resolvedLeft.materialKind === resolvedRight.materialKind &&
    resolvedLeft.noteCollectionKey === resolvedRight.noteCollectionKey &&
    resolvedLeft.progressionKey === resolvedRight.progressionKey &&
    resolvedLeft.rootNote === resolvedRight.rootNote
  );
}
