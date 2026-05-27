import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type ActiveNotesSourceKey } from "@/types/instrument-active-note";

interface ActiveNotesSourceKeyParams {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  topologyKeys?: readonly string[];
}

/**
 * Identifies the generated note surface a custom/locked note map belongs to.
 * Display-only settings such as labels and global emphasis intentionally stay
 * out of this key; musical context and instrument topology define the source.
 */
export function createActiveNotesSourceKey({
  rootNote,
  noteCollectionKey,
  topologyKeys = [],
}: ActiveNotesSourceKeyParams): ActiveNotesSourceKey {
  return JSON.stringify([rootNote, noteCollectionKey, ...topologyKeys]);
}

export function createActiveNotesDependencyKey(
  sourceKey: ActiveNotesSourceKey,
  emphasisResetKey: number,
) {
  return JSON.stringify([sourceKey, String(emphasisResetKey)]);
}
