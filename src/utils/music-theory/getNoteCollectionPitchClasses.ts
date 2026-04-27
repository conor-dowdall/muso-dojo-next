import {
  noteCollections,
  normalizeRootNoteString,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";

interface GetNoteCollectionPitchClassesParams {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
}

export function getNoteCollectionPitchClasses({
  rootNote: rawRootNote,
  noteCollectionKey,
}: GetNoteCollectionPitchClassesParams): Set<number> | null {
  const rootNote = normalizeRootNoteString(rawRootNote);
  if (!rootNote) return null;

  const collection = noteCollections[noteCollectionKey];
  if (!collection) return null;

  const rootInteger = rootNoteToIntegerMap.get(rootNote);
  if (rootInteger === undefined) return null;

  const pitchClasses = collection.integers.map(
    (interval: number) => (rootInteger + interval) % 12,
  );

  return new Set(pitchClasses);
}
