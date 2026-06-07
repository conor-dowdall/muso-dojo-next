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
export const EXERCISE_STACK_SIZE_MIN = 2;
export const EXERCISE_STACK_SIZE_MAX = 7;

export type ExerciseScaleDirection = "ascending" | "descending" | "up-down";

export type ExercisePattern =
  | {
      direction: ExerciseScaleDirection;
      kind: "scale";
    }
  | {
      interval: number;
      kind: "interval-run";
    }
  | {
      kind: "diatonic-stack";
      size: number;
    };

export interface CollectionRangeBoundary {
  octave: number;
  stepOffset: number;
}

export interface ExerciseSequenceNote {
  anchorPosition: number;
  collectionPosition: number;
  midi: number;
}

export interface ExerciseSequenceStep {
  durationUnits: number;
  note: ExerciseSequenceNote;
}

export interface ExerciseSequence {
  collectionSize: number;
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

  return [...ascending, ...ascending.toReversed().slice(1)];
}

function createPatternPositions(anchor: number, pattern: ExercisePattern) {
  switch (pattern.kind) {
    case "scale":
      return [anchor];
    case "interval-run":
      return [
        anchor,
        anchor +
          clampInteger(
            pattern.interval,
            EXERCISE_INTERVAL_MIN,
            EXERCISE_INTERVAL_MAX,
          ) -
          1,
      ];
    case "diatonic-stack": {
      const size = clampInteger(
        pattern.size,
        EXERCISE_STACK_SIZE_MIN,
        EXERCISE_STACK_SIZE_MAX,
      );
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
  pattern = { kind: "scale", direction: "up-down" },
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
  const startPosition = getCollectionPosition(start, collectionSize);
  const endPosition = getCollectionPosition(end, collectionSize);
  const firstPosition = Math.min(startPosition, endPosition);
  const lastPosition = Math.max(startPosition, endPosition);
  const direction = pattern.kind === "scale" ? pattern.direction : "ascending";
  const anchors = createScaleAnchors(firstPosition, lastPosition, direction);
  const steps = anchors.flatMap((anchorPosition, anchorIndex) => {
    const positions = createPatternPositions(anchorPosition, pattern);

    return positions.flatMap((collectionPosition, positionIndex) => {
      const midi = getMidiForCollectionPosition({
        collectionKey: resolvedCollectionKey,
        octaveOffset,
        position: collectionPosition,
        rootNote: resolvedRootNote,
      });

      if (midi === undefined || !isPlayableMidiNote(midi)) {
        return [];
      }

      const isHeldScaleEndpoint =
        pattern.kind === "scale" &&
        pattern.direction === "up-down" &&
        positionIndex === 0 &&
        (anchorIndex === 0 || anchorIndex === lastPosition - firstPosition);

      return [
        {
          durationUnits: isHeldScaleEndpoint ? 2 : 1,
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

export function getExerciseIntervalRunLabel(interval: number) {
  const labels = [
    "Seconds",
    "Thirds",
    "Fourths",
    "Fifths",
    "Sixths",
    "Sevenths",
    "Octaves",
    "Ninths",
    "Tenths",
    "Elevenths",
    "Twelfths",
    "Thirteenths",
  ] as const;
  const resolvedInterval = clampInteger(
    interval,
    EXERCISE_INTERVAL_MIN,
    EXERCISE_INTERVAL_MAX,
  );
  return labels[resolvedInterval - EXERCISE_INTERVAL_MIN];
}

export function getExerciseStackLabel(size: number) {
  switch (
    clampInteger(size, EXERCISE_STACK_SIZE_MIN, EXERCISE_STACK_SIZE_MAX)
  ) {
    case 2:
      return "Thirds";
    case 3:
      return "Triads";
    case 4:
      return "Sevenths";
    case 5:
      return "Ninths";
    case 6:
      return "Elevenths";
    case 7:
      return "Thirteenths";
  }
}
