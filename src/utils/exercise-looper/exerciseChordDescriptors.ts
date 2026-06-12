import {
  diatonicModes,
  getExtensionsForNoteCollectionKey,
  getExtensionsForRootAndNoteCollectionKey,
  getNoteNamesForRootAndNoteCollectionKey,
  getSeventhChordsForNoteCollectionKey,
  getTriadsForNoteCollectionKey,
  harmonicMinorModes,
  melodicMinorModes,
  noteCollections,
  noteNameToIntegerMap,
  normalizeRootNoteString,
  rootNotes,
  rootNoteToIntegerMap,
  type Interval,
  type NoteCollectionKey,
  type NoteName,
  type RootNote,
} from "@musodojo/music-theory-data";
import { isPlayableMidiNote } from "@/audio/pitch";
import { createExtensionPositions } from "./exercisePatternPositions";
import { getMidiForCollectionPosition } from "./exerciseSequenceRange";
import { type ExerciseChordDescriptor } from "./exerciseSequenceTypes";

const scaleDegreeModeFamilies = [
  diatonicModes,
  harmonicMinorModes,
  melodicMinorModes,
] as const;
const scaleDegreeModeKeysByCollection = new Map<
  NoteCollectionKey,
  readonly NoteCollectionKey[]
>(
  scaleDegreeModeFamilies.flatMap((family) => {
    const modesByRotation = Object.entries(family)
      .toSorted(([, left], [, right]) => left.rotation - right.rotation)
      .map(([key]) => key as NoteCollectionKey);

    return modesByRotation.map((key) => [key, modesByRotation] as const);
  }),
);
const chordSuffixByIntervalSignature = new Map(
  Object.entries(noteCollections).flatMap(([key, collection]) =>
    collection.category === "chord"
      ? [
          [
            getExtensionsForNoteCollectionKey(key as NoteCollectionKey).join(
              " ",
            ),
            collection.primaryName,
          ] as const,
        ]
      : [],
  ),
);

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function getRelativeModeCollectionKey(
  noteCollectionKey: NoteCollectionKey,
  degreeOffset: number,
) {
  const modesByRotation =
    scaleDegreeModeKeysByCollection.get(noteCollectionKey);

  if (!modesByRotation) {
    return undefined;
  }

  const baseRotation = modesByRotation.indexOf(noteCollectionKey);

  return baseRotation < 0
    ? undefined
    : modesByRotation[
        modulo(baseRotation + degreeOffset, modesByRotation.length)
      ];
}

function resolveChordRootNote(noteName: NoteName) {
  const normalizedRoot = normalizeRootNoteString(noteName);

  if (normalizedRoot) {
    return normalizedRoot;
  }

  const noteInteger = noteNameToIntegerMap.get(noteName);

  return rootNotes.find(
    (candidate) => rootNoteToIntegerMap.get(candidate) === noteInteger,
  );
}

function getChordName({
  extensionDegree,
  intervals,
  relativeCollectionKey,
  rootName,
}: {
  extensionDegree: number;
  intervals: readonly Interval[];
  relativeCollectionKey: NoteCollectionKey;
  rootName: NoteName;
}) {
  if (extensionDegree === 5) {
    const triad = getTriadsForNoteCollectionKey(relativeCollectionKey)[0];
    return triad === undefined ? rootName : `${rootName}${triad}`;
  }

  const seventh = getSeventhChordsForNoteCollectionKey(
    relativeCollectionKey,
  )[0];

  if (extensionDegree === 7) {
    return seventh === undefined ? rootName : `${rootName}${seventh}`;
  }

  const exactSuffix = chordSuffixByIntervalSignature.get(intervals.join(" "));

  if (exactSuffix !== undefined) {
    return `${rootName}${exactSuffix}`;
  }

  const baseName = seventh === undefined ? rootName : `${rootName}${seventh}`;
  const extensions = intervals.slice(4);

  return extensions.length === 0
    ? baseName
    : `${baseName} (${extensions.join(", ")})`;
}

export function createChordDescriptorsByAnchorPosition({
  anchors,
  collectionKey,
  extensionDegree,
  octaveOffset,
  rootNote,
}: {
  anchors: readonly number[];
  collectionKey: NoteCollectionKey;
  extensionDegree: number;
  octaveOffset: number;
  rootNote: RootNote;
}) {
  const result = new Map<number, ExerciseChordDescriptor>();
  const collectionSize = noteCollections[collectionKey].integers.length;
  const rootNames = getNoteNamesForRootAndNoteCollectionKey(
    rootNote,
    collectionKey,
    { filterOutOctave: true },
  );
  const chordSize = createExtensionPositions(0, extensionDegree).length;

  new Set(anchors).forEach((anchorPosition) => {
    const degreeIndex = modulo(anchorPosition, collectionSize);
    const relativeCollectionKey = getRelativeModeCollectionKey(
      collectionKey,
      degreeIndex,
    );
    const chordRootName = rootNames[degreeIndex];
    const chordRoot =
      chordRootName === undefined
        ? undefined
        : resolveChordRootNote(chordRootName);

    if (
      relativeCollectionKey === undefined ||
      chordRoot === undefined ||
      chordRootName === undefined
    ) {
      return;
    }

    const intervals = getExtensionsForRootAndNoteCollectionKey(
      chordRoot,
      relativeCollectionKey,
    ).slice(0, chordSize);
    const collectionPositions = createExtensionPositions(
      anchorPosition,
      extensionDegree,
    );
    const midiNotes = collectionPositions.flatMap((position) => {
      const midi = getMidiForCollectionPosition({
        collectionKey,
        octaveOffset,
        position,
        rootNote,
      });

      return midi === undefined || !isPlayableMidiNote(midi) ? [] : [midi];
    });

    if (
      intervals.length !== chordSize ||
      midiNotes.length !== collectionPositions.length
    ) {
      return;
    }

    result.set(anchorPosition, {
      chordName: getChordName({
        extensionDegree,
        intervals,
        relativeCollectionKey,
        rootName: chordRootName,
      }),
      collectionPositions,
      intervals,
      midiNotes,
      relativeCollectionKey,
      rootName: chordRootName,
    });
  });

  return result;
}

export function supportsScaleDegreeExercises(
  noteCollectionKey: NoteCollectionKey,
) {
  return scaleDegreeModeKeysByCollection.has(noteCollectionKey);
}

export function supportsTertianExercises(noteCollectionKey: NoteCollectionKey) {
  const collection = noteCollections[noteCollectionKey];

  return (
    supportsScaleDegreeExercises(noteCollectionKey) &&
    collection.integers.length === 7 &&
    getTriadsForNoteCollectionKey(noteCollectionKey).every(
      (quality) => quality !== undefined,
    )
  );
}
