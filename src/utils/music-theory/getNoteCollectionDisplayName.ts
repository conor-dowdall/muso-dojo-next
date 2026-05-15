import {
  groupedNoteCollections,
  type NoteCollectionGroupKey,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";

const noteCollectionDisplayNames = new Map<string, string>(
  (Object.keys(groupedNoteCollections) as NoteCollectionGroupKey[]).flatMap(
    (groupKey) =>
      Object.entries(groupedNoteCollections[groupKey] ?? {}).map(
        ([collectionKey, collection]) =>
          [collectionKey, collection.primaryName] as const,
      ),
  ),
);

export function getNoteCollectionDisplayName(
  noteCollectionKey: NoteCollectionKey | string,
) {
  return noteCollectionDisplayNames.get(noteCollectionKey) ?? noteCollectionKey;
}
