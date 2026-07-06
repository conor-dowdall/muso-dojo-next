import {
  getNoteCollectionDisplayName,
  normalizeRootNoteString,
  noteCollections,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";

type NoteCollection = (typeof noteCollections)[NoteCollectionKey];

export interface PartIdentityInput {
  noteCollectionKey: NoteCollectionKey | string;
  rootNote: string;
}

export interface PartIdentity {
  accessibleLabel: string;
  collectionName: string;
  isChord: boolean;
  label: string;
  rootNote: string;
  separator: "" | " ";
}

function getKnownNoteCollection(
  noteCollectionKey: NoteCollectionKey | string,
): NoteCollection | undefined {
  return Object.hasOwn(noteCollections, noteCollectionKey)
    ? noteCollections[noteCollectionKey as NoteCollectionKey]
    : undefined;
}

export function getPartIdentity({
  noteCollectionKey,
  rootNote,
}: PartIdentityInput): PartIdentity {
  const normalizedRootNote = normalizeRootNoteString(rootNote) || rootNote;
  const collection = getKnownNoteCollection(noteCollectionKey);
  const collectionName =
    collection?.primaryName ?? getNoteCollectionDisplayName(noteCollectionKey);
  const isChord = collection?.category === "chord";
  const separator = isChord ? "" : " ";
  const label = `${normalizedRootNote}${separator}${collectionName}`;

  return {
    accessibleLabel: `${normalizedRootNote} ${collectionName}`,
    collectionName,
    isChord,
    label,
    rootNote: normalizedRootNote,
    separator,
  };
}
