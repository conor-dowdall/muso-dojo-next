import {
  getNoteNamesForRootAndNoteCollectionKey,
  noteLabelCollections,
  normalizeRootNoteString,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";

interface GetNoteNamesProps {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
}

/**
 * Gets note name labels for a given root note and collection key.
 * Falls back to flat note names if no root/collection provided.
 */
export function getNoteNames({
  rootNote: rawRootNote,
  noteCollectionKey,
}: GetNoteNamesProps) {
  // Normalize root note (handles "C#" -> "C♯", etc.)
  const rootNote = rawRootNote
    ? normalizeRootNoteString(rawRootNote)
    : undefined;

  // Calculate note names if root and collection are provided
  if (rootNote && noteCollectionKey) {
    return getNoteNamesForRootAndNoteCollectionKey(
      rootNote,
      noteCollectionKey,
      {
        fillChromatic: true,
        rotateToRootInteger0: true,
      },
    );
  } else {
    return [...noteLabelCollections.noteNamesFlat.labels];
  }
}
