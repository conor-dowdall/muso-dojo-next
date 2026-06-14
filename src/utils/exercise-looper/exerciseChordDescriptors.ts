import {
  diatonicModes,
  getCompoundIntervalsForRootAndNoteCollectionKey,
  getExtensionsForNoteCollectionKey,
  getExtensionsForRootAndNoteCollectionKey,
  getIntervalsForRootAndNoteCollectionKey,
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
import {
  clampExerciseInteger,
  createExtensionPositions,
} from "./exercisePatternPositions";
import { getMidiForCollectionPosition } from "./exerciseSequenceRange";
import {
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  type ExerciseChordDescriptor,
  type ExerciseScaleDegreeDescriptor,
} from "./exerciseSequenceTypes";

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

function createScaleDegreeContexts({
  anchors,
  collectionKey,
  rootNote,
}: {
  anchors: readonly number[];
  collectionKey: NoteCollectionKey;
  rootNote: RootNote;
}) {
  const collectionSize = noteCollections[collectionKey].integers.length;
  const rootNames = getNoteNamesForRootAndNoteCollectionKey(
    rootNote,
    collectionKey,
    { filterOutOctave: true },
  );

  return [...new Set(anchors)].flatMap((anchorPosition) => {
    const degreeIndex = modulo(anchorPosition, collectionSize);
    const relativeCollectionKey = getRelativeModeCollectionKey(
      collectionKey,
      degreeIndex,
    );
    const rootName = rootNames[degreeIndex];
    const resolvedRoot =
      rootName === undefined ? undefined : resolveChordRootNote(rootName);

    return relativeCollectionKey === undefined ||
      resolvedRoot === undefined ||
      rootName === undefined
      ? []
      : [
          {
            anchorPosition,
            relativeCollectionKey,
            resolvedRoot,
            rootName,
          },
        ];
  });
}

function getMidiNotesForCollectionPositions({
  collectionKey,
  collectionPositions,
  octaveOffset,
  rootNote,
}: {
  collectionKey: NoteCollectionKey;
  collectionPositions: readonly number[];
  octaveOffset: number;
  rootNote: RootNote;
}) {
  return collectionPositions.flatMap((position) => {
    const midi = getMidiForCollectionPosition({
      collectionKey,
      octaveOffset,
      position,
      rootNote,
    });

    return midi === undefined || !isPlayableMidiNote(midi) ? [] : [midi];
  });
}

function getPackageIntervalForDegree({
  degree,
  relativeCollectionKey,
  rootNote,
}: {
  degree: number;
  relativeCollectionKey: NoteCollectionKey;
  rootNote: RootNote;
}) {
  if (degree <= 8) {
    return getIntervalsForRootAndNoteCollectionKey(
      rootNote,
      relativeCollectionKey,
      { filterOutOctave: false },
    )[degree - 1];
  }

  return getCompoundIntervalsForRootAndNoteCollectionKey(
    rootNote,
    relativeCollectionKey,
    { filterOutOctave: false },
  )[degree - 7];
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
  const contexts = createScaleDegreeContexts({
    anchors,
    collectionKey,
    rootNote,
  });
  const chordSize = createExtensionPositions(0, extensionDegree).length;

  contexts.forEach(
    ({ anchorPosition, relativeCollectionKey, resolvedRoot, rootName }) => {
      const intervals = getExtensionsForRootAndNoteCollectionKey(
        resolvedRoot,
        relativeCollectionKey,
      ).slice(0, chordSize);
      const collectionPositions = createExtensionPositions(
        anchorPosition,
        extensionDegree,
      );
      const midiNotes = getMidiNotesForCollectionPositions({
        collectionKey,
        collectionPositions,
        octaveOffset,
        rootNote,
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
          rootName,
        }),
        collectionPositions,
        intervals,
        midiNotes,
        relativeCollectionKey,
        rootName,
      });
    },
  );

  return result;
}

export function createIntervalDescriptorsByAnchorPosition({
  anchors,
  collectionKey,
  intervalDegree,
  octaveOffset,
  rootNote,
}: {
  anchors: readonly number[];
  collectionKey: NoteCollectionKey;
  intervalDegree: number;
  octaveOffset: number;
  rootNote: RootNote;
}) {
  const result = new Map<number, ExerciseScaleDegreeDescriptor>();
  const degree = clampExerciseInteger(
    intervalDegree,
    EXERCISE_INTERVAL_MIN,
    EXERCISE_INTERVAL_MAX,
  );
  const contexts = createScaleDegreeContexts({
    anchors,
    collectionKey,
    rootNote,
  });

  contexts.forEach(
    ({ anchorPosition, relativeCollectionKey, resolvedRoot, rootName }) => {
      const selectedInterval = getPackageIntervalForDegree({
        degree,
        relativeCollectionKey,
        rootNote: resolvedRoot,
      });
      const collectionPositions = [anchorPosition, anchorPosition + degree - 1];
      const midiNotes = getMidiNotesForCollectionPositions({
        collectionKey,
        collectionPositions,
        octaveOffset,
        rootNote,
      });

      if (
        selectedInterval === undefined ||
        midiNotes.length !== collectionPositions.length
      ) {
        return;
      }

      result.set(anchorPosition, {
        collectionPositions,
        intervals: ["1", selectedInterval],
        midiNotes,
        relativeCollectionKey,
        rootName,
      });
    },
  );

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
