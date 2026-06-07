import {
  getTriadsForNoteCollectionKey,
  isValidNoteCollectionKey,
  normalizeRootNoteString,
  noteCollections,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { MIDI_MAX, MIDI_MIN, isPlayableMidiNote } from "@/audio/pitch";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";

const SEMITONES_PER_OCTAVE = 12;
const BASE_ROOT_MIDI = 48;

export const EXERCISE_INTERVAL_MIN = 2;
export const EXERCISE_INTERVAL_MAX = 13;
export const EXERCISE_MAX_OCTAVE_SPAN = 4;

export type ExerciseScaleDirection = "ascending" | "descending" | "up-down";
export type ExercisePatternMode = "single" | "interval" | "extension";

export interface ExercisePattern {
  degree: number;
  direction: ExerciseScaleDirection;
  mode: ExercisePatternMode;
}

export interface CollectionRangeBoundary {
  octave: number;
  stepOffset: number;
}

export interface ExerciseSequenceNote {
  anchorPosition: number;
  collectionPosition: number;
  midi: number;
}

export interface ExerciseDisplayNote {
  collectionPosition: number;
  columnIndex: number;
  key: string;
  midi: number;
  rowIndex: number;
}

export interface ExerciseSequenceStep {
  durationUnits: number;
  note: ExerciseSequenceNote;
}

export interface ExerciseSequence {
  collectionSize: number;
  firstPosition: number;
  lastPosition: number;
  notes: ExerciseDisplayNote[];
  rows: ExerciseDisplayNote[][];
  steps: ExerciseSequenceStep[];
  supportsTertianExercises: boolean;
}

function resolveRootNote(value: unknown): RootNote {
  return typeof value === "string"
    ? (normalizeRootNoteString(value) ?? DEFAULT_PART_ROOT_NOTE)
    : DEFAULT_PART_ROOT_NOTE;
}

function resolveCollectionKey(value: unknown): NoteCollectionKey {
  return typeof value === "string" && isValidNoteCollectionKey(value)
    ? value
    : DEFAULT_PART_NOTE_COLLECTION_KEY;
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function floorDivide(value: number, divisor: number) {
  return Math.floor(value / divisor);
}

export function getCollectionPosition(
  boundary: CollectionRangeBoundary,
  collectionSize: number,
) {
  return boundary.octave * collectionSize + boundary.stepOffset;
}

export function getCollectionRangeBoundary(
  position: number,
  collectionSize: number,
): CollectionRangeBoundary {
  const octave = floorDivide(position, collectionSize);

  return {
    octave,
    stepOffset: position - octave * collectionSize,
  };
}

export function getMidiForCollectionPosition({
  collectionKey,
  octaveOffset = 0,
  position,
  rootNote,
}: {
  collectionKey: NoteCollectionKey;
  octaveOffset?: number;
  position: number;
  rootNote: RootNote;
}) {
  const collection = noteCollections[collectionKey];
  const collectionSize = collection.integers.length;

  if (collectionSize === 0) {
    return undefined;
  }

  const octave = floorDivide(position, collectionSize);
  const collectionIndex =
    ((position % collectionSize) + collectionSize) % collectionSize;
  const interval = collection.integers[collectionIndex];
  const rootInteger = rootNoteToIntegerMap.get(rootNote);

  if (interval === undefined || rootInteger === undefined) {
    return undefined;
  }

  return (
    BASE_ROOT_MIDI +
    rootInteger +
    (octave + octaveOffset) * SEMITONES_PER_OCTAVE +
    interval
  );
}

export function supportsTertianExercises(noteCollectionKey: NoteCollectionKey) {
  const collection = noteCollections[noteCollectionKey];

  return (
    collection.integers.length === 7 &&
    getTriadsForNoteCollectionKey(noteCollectionKey).every(
      (quality) => quality !== undefined,
    )
  );
}

function createScaleAnchors(
  startPosition: number,
  endPosition: number,
  direction: ExerciseScaleDirection,
) {
  const ascending = Array.from(
    { length: endPosition - startPosition + 1 },
    (_, index) => startPosition + index,
  );

  if (direction === "ascending") {
    return ascending;
  }

  if (direction === "descending") {
    return ascending.toReversed();
  }

  // Omit both repeated endpoints. The next cycle supplies the lower endpoint,
  // producing an even ...up, down, up... pendulum without doubled beats.
  return [...ascending, ...ascending.toReversed().slice(1, -1)];
}

function createPatternPositions(anchor: number, pattern: ExercisePattern) {
  switch (pattern.mode) {
    case "single":
      return [anchor];
    case "interval":
      return [
        anchor,
        anchor +
          clampInteger(
            pattern.degree,
            EXERCISE_INTERVAL_MIN,
            EXERCISE_INTERVAL_MAX,
          ) -
          1,
      ];
    case "extension": {
      const degree = clampInteger(
        pattern.degree,
        EXERCISE_INTERVAL_MIN,
        EXERCISE_INTERVAL_MAX,
      );
      const size = Math.floor((degree + 1) / 2);
      return Array.from({ length: size }, (_, index) => anchor + index * 2);
    }
  }
}

export function getExerciseAnchorPositionBounds({
  noteCollectionKey,
  octaveOffset = 0,
  pattern,
  rootNote,
}: {
  noteCollectionKey?: unknown;
  octaveOffset?: number;
  pattern: ExercisePattern;
  rootNote?: unknown;
}) {
  const resolvedCollectionKey = resolveCollectionKey(noteCollectionKey);
  const resolvedRootNote = resolveRootNote(rootNote);
  const collectionSize = noteCollections[resolvedCollectionKey].integers.length;
  const rootInteger = rootNoteToIntegerMap.get(resolvedRootNote) ?? 0;
  const rootMidi =
    BASE_ROOT_MIDI + rootInteger + octaveOffset * SEMITONES_PER_OCTAVE;
  const searchMin =
    Math.floor((MIDI_MIN - rootMidi) / SEMITONES_PER_OCTAVE) * collectionSize -
    collectionSize;
  const searchMax =
    Math.ceil((MIDI_MAX - rootMidi) / SEMITONES_PER_OCTAVE) * collectionSize +
    collectionSize;
  const playablePositions: number[] = [];

  for (let position = searchMin; position <= searchMax; position += 1) {
    const patternPositions = createPatternPositions(position, pattern);
    const isPlayable = patternPositions.every((patternPosition) => {
      const midi = getMidiForCollectionPosition({
        collectionKey: resolvedCollectionKey,
        octaveOffset,
        position: patternPosition,
        rootNote: resolvedRootNote,
      });
      return midi !== undefined && isPlayableMidiNote(midi);
    });

    if (isPlayable) {
      playablePositions.push(position);
    }
  }

  return {
    max: playablePositions.at(-1) ?? 0,
    min: playablePositions[0] ?? 0,
  };
}

export function createExerciseSequence({
  end = { octave: 1, stepOffset: 0 },
  noteCollectionKey,
  octaveOffset = 0,
  pattern = { degree: 3, direction: "up-down", mode: "single" },
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
  const resolvedCollectionKey = resolveCollectionKey(noteCollectionKey);
  const resolvedRootNote = resolveRootNote(rootNote);
  const collectionSize = noteCollections[resolvedCollectionKey].integers.length;
  const bounds = getExerciseAnchorPositionBounds({
    noteCollectionKey: resolvedCollectionKey,
    octaveOffset,
    pattern,
    rootNote: resolvedRootNote,
  });
  const requestedStartPosition = getCollectionPosition(start, collectionSize);
  const requestedEndPosition = getCollectionPosition(end, collectionSize);
  const requestedFirstPosition = Math.min(
    requestedStartPosition,
    requestedEndPosition,
  );
  const requestedLastPosition = Math.max(
    requestedStartPosition,
    requestedEndPosition,
  );
  const firstPosition = clampInteger(
    requestedFirstPosition,
    bounds.min,
    bounds.max,
  );
  const lastPosition = clampInteger(
    requestedLastPosition,
    firstPosition,
    Math.min(
      bounds.max,
      firstPosition + collectionSize * EXERCISE_MAX_OCTAVE_SPAN,
    ),
  );
  const firstOctave = floorDivide(firstPosition, collectionSize);
  const lastOctave = floorDivide(lastPosition, collectionSize);
  const rows = Array.from(
    { length: lastOctave - firstOctave + 1 },
    () => [] as ExerciseDisplayNote[],
  );
  const notes = Array.from(
    { length: lastPosition - firstPosition + 1 },
    (_, index) => firstPosition + index,
  ).flatMap((collectionPosition) => {
    const midi = getMidiForCollectionPosition({
      collectionKey: resolvedCollectionKey,
      octaveOffset,
      position: collectionPosition,
      rootNote: resolvedRootNote,
    });

    if (midi === undefined || !isPlayableMidiNote(midi)) {
      return [];
    }

    const octave = floorDivide(collectionPosition, collectionSize);
    const rowIndex = octave - firstOctave;
    const displayNote: ExerciseDisplayNote = {
      collectionPosition,
      columnIndex:
        ((collectionPosition % collectionSize) + collectionSize) %
        collectionSize,
      key: `position-${collectionPosition}`,
      midi,
      rowIndex,
    };

    rows[rowIndex]?.push(displayNote);
    return [displayNote];
  });
  const anchors = createScaleAnchors(
    firstPosition,
    lastPosition,
    pattern.direction,
  );
  const steps = anchors.flatMap((anchorPosition) => {
    const positions = createPatternPositions(anchorPosition, pattern);

    return positions.flatMap((collectionPosition) => {
      const midi = getMidiForCollectionPosition({
        collectionKey: resolvedCollectionKey,
        octaveOffset,
        position: collectionPosition,
        rootNote: resolvedRootNote,
      });

      if (midi === undefined || !isPlayableMidiNote(midi)) {
        return [];
      }

      return [
        {
          durationUnits: 1,
          note: {
            anchorPosition,
            collectionPosition,
            midi,
          },
        },
      ];
    });
  });

  return {
    collectionSize,
    firstPosition,
    lastPosition,
    notes,
    rows,
    steps,
    supportsTertianExercises: supportsTertianExercises(resolvedCollectionKey),
  };
}

export function getExerciseIntervalLabel(interval: number) {
  const resolvedInterval = clampInteger(
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
