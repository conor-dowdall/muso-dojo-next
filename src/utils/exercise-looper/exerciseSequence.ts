import {
  diatonicModes,
  getExtensionsForRootAndNoteCollectionKey,
  getNoteNamesForRootAndNoteCollectionKey,
  getTriadsForNoteCollectionKey,
  harmonicMinorModes,
  isValidNoteCollectionKey,
  melodicMinorModes,
  noteNameToIntegerMap,
  normalizeRootNoteString,
  noteCollections,
  rootNotes,
  rootNoteToIntegerMap,
  type Interval,
  type NoteName,
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
export type ExerciseNotePlayback = "separate" | "together";

export interface ExercisePattern {
  direction: ExerciseScaleDirection;
  extensionDegree: number;
  extensionDirection: ExerciseScaleDirection;
  intervalDegree: number;
  intervalDirection: ExerciseScaleDirection;
  mode: ExercisePatternMode;
  notePlayback: ExerciseNotePlayback;
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
  notes: ExerciseSequenceNote[];
}

export interface ExerciseSequence {
  chordIntervalsByAnchorPosition: ReadonlyMap<number, readonly Interval[]>;
  collectionSize: number;
  firstPosition: number;
  lastPosition: number;
  notes: ExerciseDisplayNote[];
  rows: ExerciseDisplayNote[][];
  steps: ExerciseSequenceStep[];
  supportsScaleDegreeExercises: boolean;
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

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

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

function createChordIntervalsByAnchorPosition({
  anchors,
  collectionKey,
  extensionDegree,
  rootNote,
}: {
  anchors: readonly number[];
  collectionKey: NoteCollectionKey;
  extensionDegree: number;
  rootNote: RootNote;
}) {
  const result = new Map<number, readonly Interval[]>();
  const collectionSize = noteCollections[collectionKey].integers.length;
  const rootNames = getNoteNamesForRootAndNoteCollectionKey(
    rootNote,
    collectionKey,
    { filterOutOctave: true },
  );
  const chordSize = Math.floor(
    (clampInteger(
      extensionDegree,
      EXERCISE_INTERVAL_MIN,
      EXERCISE_INTERVAL_MAX,
    ) +
      1) /
      2,
  );

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

    if (relativeCollectionKey === undefined || chordRoot === undefined) {
      return;
    }

    result.set(
      anchorPosition,
      getExtensionsForRootAndNoteCollectionKey(
        chordRoot,
        relativeCollectionKey,
      ).slice(0, chordSize),
    );
  });

  return result;
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
    supportsScaleDegreeExercises(noteCollectionKey) &&
    collection.integers.length === 7 &&
    getTriadsForNoteCollectionKey(noteCollectionKey).every(
      (quality) => quality !== undefined,
    )
  );
}

export function supportsScaleDegreeExercises(
  noteCollectionKey: NoteCollectionKey,
) {
  return scaleDegreeModeKeysByCollection.has(noteCollectionKey);
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

function createInnerContour(
  positions: readonly number[],
  direction: ExerciseScaleDirection,
) {
  if (direction === "ascending") {
    return positions;
  }

  if (direction === "descending") {
    return positions.toReversed();
  }

  return [...positions, ...positions.toReversed().slice(1)];
}

function createPatternPositionGroups(anchor: number, pattern: ExercisePattern) {
  switch (pattern.mode) {
    case "single":
      return [[anchor]];
    case "interval": {
      const positions = [
        anchor,
        anchor +
          clampInteger(
            pattern.intervalDegree,
            EXERCISE_INTERVAL_MIN,
            EXERCISE_INTERVAL_MAX,
          ) -
          1,
      ];

      return pattern.notePlayback === "together"
        ? [positions]
        : createInnerContour(positions, pattern.intervalDirection).map(
            (position) => [position],
          );
    }
    case "extension": {
      const degree = clampInteger(
        pattern.extensionDegree,
        EXERCISE_INTERVAL_MIN,
        EXERCISE_INTERVAL_MAX,
      );
      const size = Math.floor((degree + 1) / 2);
      const positions = Array.from(
        { length: size },
        (_, index) => anchor + index * 2,
      );

      return pattern.notePlayback === "together"
        ? [positions]
        : createInnerContour(positions, pattern.extensionDirection).map(
            (position) => [position],
          );
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
    const patternPositions = createPatternPositionGroups(
      position,
      pattern,
    ).flat();
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
  pattern = {
    direction: "up-down",
    extensionDegree: 3,
    extensionDirection: "up-down",
    intervalDegree: 3,
    intervalDirection: "up-down",
    mode: "single",
    notePlayback: "separate",
  },
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
  const chordIntervalsByAnchorPosition =
    pattern.mode === "extension"
      ? createChordIntervalsByAnchorPosition({
          anchors,
          collectionKey: resolvedCollectionKey,
          extensionDegree: pattern.extensionDegree,
          rootNote: resolvedRootNote,
        })
      : new Map<number, readonly Interval[]>();
  const steps = anchors.flatMap((anchorPosition) => {
    const positionGroups = createPatternPositionGroups(anchorPosition, pattern);

    return positionGroups.flatMap((positions) => {
      const notes = positions.flatMap((collectionPosition) => {
        const midi = getMidiForCollectionPosition({
          collectionKey: resolvedCollectionKey,
          octaveOffset,
          position: collectionPosition,
          rootNote: resolvedRootNote,
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

  return {
    chordIntervalsByAnchorPosition,
    collectionSize,
    firstPosition,
    lastPosition,
    notes,
    rows,
    steps,
    supportsScaleDegreeExercises: supportsScaleDegreeExercises(
      resolvedCollectionKey,
    ),
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
