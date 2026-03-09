import {
  getNoteNamesForRootAndNoteCollectionKey,
  noteLabelCollections,
  normalizeRootNoteString,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";

interface GetFretboardNotesProps {
  rootNote?: string;
  noteCollectionKey?: NoteCollectionKey;
}

export function getFretboardNotes({
  rootNote: rawRootNote,
  noteCollectionKey,
}: GetFretboardNotesProps) {
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
