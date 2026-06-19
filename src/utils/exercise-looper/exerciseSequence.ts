import {
  getNoteNamesForRootAndNoteCollectionKey,
  noteCollections,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { isPlayableMidiNote } from "@/audio/pitch";
import {
  getCollectionToneAtPosition,
  getCollectionToneSequenceMetadata,
} from "@/utils/music-theory/collectionToneSequence";
import {
  createChordDescriptorsByAnchorPosition,
  createIntervalDescriptorsByAnchorPosition,
  supportsScaleDegreeExercises,
  supportsTertianExercises,
} from "./exerciseChordDescriptors";
import {
  clampExerciseInteger,
  createPatternPositionGroups,
  createScaleAnchors,
} from "./exercisePatternPositions";
import {
  getCollectionPosition,
  getExerciseAnchorPositionBounds,
  getMidiForCollectionPosition,
  resolveExerciseCollectionKey,
  resolveExerciseRootNote,
} from "./exerciseSequenceRange";
import {
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  EXERCISE_MAX_OCTAVE_SPAN,
  type CollectionRangeBoundary,
  type ExerciseChordDescriptor,
  type ExerciseDisplayNote,
  type ExercisePattern,
  type ExerciseScaleDegreeDescriptor,
  type ExerciseSequence,
  type ExerciseStudyNote,
} from "./exerciseSequenceTypes";

export {
  supportsScaleDegreeExercises,
  supportsTertianExercises,
} from "./exerciseChordDescriptors";
export {
  getCollectionPosition,
  getCollectionRangeBoundary,
  getExerciseAnchorPositionBounds,
  getExerciseBaseOctave,
  getMidiForCollectionPosition,
} from "./exerciseSequenceRange";
export {
  EXERCISE_INTERVAL_MAX,
  EXERCISE_INTERVAL_MIN,
  EXERCISE_MAX_OCTAVE_SPAN,
} from "./exerciseSequenceTypes";
export type {
  CollectionRangeBoundary,
  ExerciseChordDescriptor,
  ExerciseDisplayNote,
  ExerciseNotePlayback,
  ExercisePattern,
  ExercisePatternMode,
  ExerciseScaleDirection,
  ExerciseSequence,
  ExerciseSequenceNote,
  ExerciseSequenceStep,
  ExerciseScaleDegreeDescriptor,
  ExerciseStudyNote,
} from "./exerciseSequenceTypes";

const DEFAULT_EXERCISE_PATTERN: ExercisePattern = {
  direction: "up-down",
  extensionDegree: 5,
  extensionDirection: "up-down",
  intervalDegree: 3,
  intervalDirection: "up-down",
  mode: "single",
  notePlayback: "separate",
};

function createSequenceSteps({
  anchors,
  collectionKey,
  octaveOffset,
  pattern,
  rootNote,
}: {
  anchors: readonly number[];
  collectionKey: NoteCollectionKey;
  octaveOffset: number;
  pattern: ExercisePattern;
  rootNote: ReturnType<typeof resolveExerciseRootNote>;
}) {
  return anchors.flatMap((anchorPosition) => {
    const positionGroups = createPatternPositionGroups(anchorPosition, pattern);

    return positionGroups.flatMap((positions) => {
      const notes = positions.flatMap((collectionPosition) => {
        const midi = getMidiForCollectionPosition({
          collectionKey,
          octaveOffset,
          position: collectionPosition,
          rootNote,
        });

        return midi === undefined || !isPlayableMidiNote(midi)
          ? []
          : [
              {
                anchorPosition,
                collectionPosition,
                midi,
              },
            ];
      });

      return notes.length === positions.length
        ? [{ durationUnits: 1, notes }]
        : [];
    });
  });
}

function createDisplayRows({
  collectionKey,
  displayPositions,
  firstPosition,
  lastPosition,
  noteNames,
  octaveOffset,
  rootNote,
}: {
  collectionKey: NoteCollectionKey;
  displayPositions: readonly number[];
  firstPosition: number;
  lastPosition: number;
  noteNames: readonly string[];
  octaveOffset: number;
  rootNote: ReturnType<typeof resolveExerciseRootNote>;
}) {
  const metadata = getCollectionToneSequenceMetadata(collectionKey);
  const firstOctave =
    getCollectionToneAtPosition(collectionKey, firstPosition)?.octave ?? 0;
  const lastDisplayPosition = displayPositions.at(-1) ?? lastPosition;
  const lastDisplayOctave =
    getCollectionToneAtPosition(collectionKey, lastDisplayPosition)?.octave ??
    firstOctave;
  const rows = Array.from(
    { length: lastDisplayOctave - firstOctave + 1 },
    () => [] as ExerciseDisplayNote[],
  );

  displayPositions.forEach((collectionPosition) => {
    const midi = getMidiForCollectionPosition({
      collectionKey,
      octaveOffset,
      position: collectionPosition,
      rootNote,
    });

    if (midi === undefined || !isPlayableMidiNote(midi)) {
      return;
    }

    const tone = getCollectionToneAtPosition(collectionKey, collectionPosition);

    if (!tone) {
      return;
    }

    const rowIndex = tone.octave - firstOctave;
    const displayNote: ExerciseDisplayNote = {
      collectionDegreeSignature: metadata.degreeSignature,
      collectionPosition,
      columnIndex: tone.columnIndex,
      intervalDegree: tone.intervalDegree,
      intervalLabel: tone.intervalLabel,
      isAnchor:
        collectionPosition >= firstPosition &&
        collectionPosition <= lastPosition,
      key: `position-${collectionPosition}`,
      label: noteNames[tone.collectionIndex] ?? "",
      midi,
      rowIndex,
    };

    rows[rowIndex]?.push(displayNote);
  });

  return rows.map((row) =>
    row.toSorted((left, right) => left.midi - right.midi),
  );
}

function createStudyReference({
  collectionKey,
  noteNames,
}: {
  collectionKey: NoteCollectionKey;
  noteNames: readonly string[];
}) {
  const metadata = getCollectionToneSequenceMetadata(collectionKey);
  const studyReference = metadata.tones.flatMap((tone): ExerciseStudyNote[] => {
    const label = noteNames[tone.collectionIndex];

    return label === undefined
      ? []
      : [{ intervalLabel: tone.intervalLabel, label }];
  });

  if (
    noteCollections[collectionKey].category !== "scale" ||
    studyReference.length === 0
  ) {
    return studyReference;
  }

  const octave = getCollectionToneAtPosition(
    collectionKey,
    metadata.tones.length,
  );
  const rootName = noteNames[0];

  return octave === undefined || rootName === undefined
    ? studyReference
    : [
        ...studyReference,
        { intervalLabel: octave.intervalLabel, label: rootName },
      ];
}

export function createExerciseSequence({
  end,
  noteCollectionKey,
  octaveOffset = 0,
  pattern = DEFAULT_EXERCISE_PATTERN,
  rootNote,
  start = { octave: 0, stepOffset: 0 },
}: {
  end?: CollectionRangeBoundary;
  noteCollectionKey?: unknown;
  octaveOffset?: number;
  pattern?: ExercisePattern;
  rootNote?: unknown;
  start?: CollectionRangeBoundary;
}): ExerciseSequence {
  const resolvedCollectionKey = resolveExerciseCollectionKey(noteCollectionKey);
  const resolvedRootNote = resolveExerciseRootNote(rootNote);
  const toneSequence = getCollectionToneSequenceMetadata(resolvedCollectionKey);
  const collectionSize = toneSequence.tones.length;
  const resolvedEnd = end ?? { octave: 1, stepOffset: 0 };
  const noteNames = getNoteNamesForRootAndNoteCollectionKey(
    resolvedRootNote,
    resolvedCollectionKey,
    { filterOutOctave: true },
  );
  const bounds = getExerciseAnchorPositionBounds({
    noteCollectionKey: resolvedCollectionKey,
    octaveOffset,
    pattern,
    rootNote: resolvedRootNote,
  });
  const requestedStartPosition = getCollectionPosition(
    start,
    collectionSize,
    toneSequence.isFiniteVoicing,
  );
  const requestedEndPosition = getCollectionPosition(
    resolvedEnd,
    collectionSize,
    toneSequence.isFiniteVoicing,
  );
  const requestedFirstPosition = Math.min(
    requestedStartPosition,
    requestedEndPosition,
  );
  const requestedLastPosition = Math.max(
    requestedStartPosition,
    requestedEndPosition,
  );
  const firstPosition = clampExerciseInteger(
    requestedFirstPosition,
    bounds.min,
    bounds.max,
  );
  const lastPosition = clampExerciseInteger(
    requestedLastPosition,
    firstPosition,
    Math.min(
      bounds.max,
      firstPosition + collectionSize * EXERCISE_MAX_OCTAVE_SPAN,
    ),
  );
  const anchors = createScaleAnchors(
    firstPosition,
    lastPosition,
    pattern.direction,
  );
  const chordDescriptorsByAnchorPosition =
    pattern.mode === "extension"
      ? createChordDescriptorsByAnchorPosition({
          anchors,
          collectionKey: resolvedCollectionKey,
          extensionDegree: pattern.extensionDegree,
          octaveOffset,
          rootNote: resolvedRootNote,
        })
      : new Map<number, ExerciseChordDescriptor>();
  const intervalDescriptorsByAnchorPosition =
    pattern.mode === "interval"
      ? createIntervalDescriptorsByAnchorPosition({
          anchors,
          collectionKey: resolvedCollectionKey,
          intervalDegree: pattern.intervalDegree,
          octaveOffset,
          rootNote: resolvedRootNote,
        })
      : new Map<number, ExerciseScaleDegreeDescriptor>();
  const steps = createSequenceSteps({
    anchors,
    collectionKey: resolvedCollectionKey,
    octaveOffset,
    pattern,
    rootNote: resolvedRootNote,
  });
  const anchorPositions = Array.from(
    { length: lastPosition - firstPosition + 1 },
    (_, index) => firstPosition + index,
  );
  const displayPositions = [
    ...new Set([
      ...anchorPositions,
      ...steps.flatMap((step) =>
        step.notes.map((note) => note.collectionPosition),
      ),
    ]),
  ].toSorted((left, right) => left - right);
  const displayRows = createDisplayRows({
    collectionKey: resolvedCollectionKey,
    displayPositions,
    firstPosition,
    lastPosition,
    noteNames,
    octaveOffset,
    rootNote: resolvedRootNote,
  });
  const displayNotes = displayRows.flat();
  const notes = displayNotes.filter((note) => note.isAnchor);
  const studyReference = createStudyReference({
    collectionKey: resolvedCollectionKey,
    noteNames,
  });
  const firstAnchorOctave =
    getCollectionToneAtPosition(resolvedCollectionKey, firstPosition)?.octave ??
    0;
  const lastAnchorOctave =
    getCollectionToneAtPosition(resolvedCollectionKey, lastPosition)?.octave ??
    firstAnchorOctave;
  const rows = Array.from(
    { length: lastAnchorOctave - firstAnchorOctave + 1 },
    () => [] as ExerciseDisplayNote[],
  );

  notes.forEach((note) => rows[note.rowIndex]?.push(note));

  return {
    chordDescriptorsByAnchorPosition,
    collectionSize,
    columnCount: toneSequence.columnCount,
    displayNotes,
    displayRows,
    firstPosition,
    isFiniteVoicing: toneSequence.isFiniteVoicing,
    intervalDescriptorsByAnchorPosition,
    lastPosition,
    notes,
    rows,
    steps,
    studyReference,
    supportsOctaveRangeEditing: toneSequence.supportsOctaveRangeEditing,
    supportsScaleDegreeExercises: supportsScaleDegreeExercises(
      resolvedCollectionKey,
    ),
    supportsTertianExercises: supportsTertianExercises(resolvedCollectionKey),
  };
}

export function getExerciseIntervalLabel(interval: number) {
  const resolvedInterval = clampExerciseInteger(
    interval,
    EXERCISE_INTERVAL_MIN,
    EXERCISE_INTERVAL_MAX,
  );
  const remainder = resolvedInterval % 10;
  const suffix =
    resolvedInterval % 100 >= 11 && resolvedInterval % 100 <= 13
      ? "th"
      : remainder === 1
        ? "st"
        : remainder === 2
          ? "nd"
          : remainder === 3
            ? "rd"
            : "th";

  return `${resolvedInterval}${suffix}`;
}
