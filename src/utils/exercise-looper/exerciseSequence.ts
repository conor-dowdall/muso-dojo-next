import {
  diatonicModes,
  getExtensionsForNoteCollectionKey,
  getExtensionsForRootAndNoteCollectionKey,
  getNoteNamesForRootAndNoteCollectionKey,
  getSeventhChordsForNoteCollectionKey,
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
  getCollectionToneAtPosition,
  getCollectionToneSequenceMetadata,
} from "@/utils/music-theory/collectionToneSequence";
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
  intervalLabel: string;
  isAnchor: boolean;
  key: string;
  label: string;
  midi: number;
  rowIndex: number;
}

export interface ExerciseSequenceStep {
  durationUnits: number;
  notes: ExerciseSequenceNote[];
}

export interface ExerciseChordDescriptor {
  chordName: string;
  collectionPositions: readonly number[];
  intervals: readonly Interval[];
  midiNotes: readonly number[];
  relativeCollectionKey: NoteCollectionKey;
  rootName: NoteName;
}

export interface ExerciseSequence {
  chordDescriptorsByAnchorPosition: ReadonlyMap<
    number,
    ExerciseChordDescriptor
  >;
  collectionSize: number;
  columnCount: number;
  displayNotes: ExerciseDisplayNote[];
  displayRows: ExerciseDisplayNote[][];
  firstPosition: number;
  isFiniteVoicing: boolean;
  lastPosition: number;
  notes: ExerciseDisplayNote[];
  rows: ExerciseDisplayNote[][];
  steps: ExerciseSequenceStep[];
  supportsOctaveRangeEditing: boolean;
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

function createExtensionPositions(anchor: number, extensionDegree: number) {
  const degree = clampInteger(
    extensionDegree,
    EXERCISE_INTERVAL_MIN,
    EXERCISE_INTERVAL_MAX,
  );
  const size = Math.floor((degree + 1) / 2);

  return Array.from({ length: size }, (_, index) => anchor + index * 2);
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

function createChordDescriptorsByAnchorPosition({
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

export function getCollectionPosition(
  boundary: CollectionRangeBoundary,
  collectionSize: number,
  isFiniteVoicing = false,
) {
  if (isFiniteVoicing && boundary.octave > 0) {
    return boundary.octave * collectionSize + boundary.stepOffset - 1;
  }

  return boundary.octave * collectionSize + boundary.stepOffset;
}

export function getCollectionRangeBoundary(
  position: number,
  collectionSize: number,
  isFiniteVoicing = false,
): CollectionRangeBoundary {
  if (isFiniteVoicing && position >= collectionSize - 1) {
    const octave = floorDivide(position + 1, collectionSize);

    return {
      octave,
      stepOffset: position + 1 - octave * collectionSize,
    };
  }

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
  const tone = getCollectionToneAtPosition(collectionKey, position);

  if (!tone) {
    return undefined;
  }

  const rootInteger = rootNoteToIntegerMap.get(rootNote);

  if (rootInteger === undefined) {
    return undefined;
  }

  return (
    BASE_ROOT_MIDI +
    rootInteger +
    octaveOffset * SEMITONES_PER_OCTAVE +
    tone.semitones
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
      const positions = createExtensionPositions(
        anchor,
        pattern.extensionDegree,
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
  end,
  noteCollectionKey,
  octaveOffset = 0,
  pattern = {
    direction: "up-down",
    extensionDegree: 5,
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
  const firstOctave =
    getCollectionToneAtPosition(resolvedCollectionKey, firstPosition)?.octave ??
    0;
  const lastDisplayPosition = displayPositions.at(-1) ?? lastPosition;
  const lastDisplayOctave =
    getCollectionToneAtPosition(resolvedCollectionKey, lastDisplayPosition)
      ?.octave ?? firstOctave;
  const mutableDisplayRows = Array.from(
    { length: lastDisplayOctave - firstOctave + 1 },
    () => [] as ExerciseDisplayNote[],
  );
  displayPositions.forEach((collectionPosition) => {
    const midi = getMidiForCollectionPosition({
      collectionKey: resolvedCollectionKey,
      octaveOffset,
      position: collectionPosition,
      rootNote: resolvedRootNote,
    });

    if (midi === undefined || !isPlayableMidiNote(midi)) {
      return;
    }

    const tone = getCollectionToneAtPosition(
      resolvedCollectionKey,
      collectionPosition,
    );

    if (!tone) {
      return;
    }

    const rowIndex = tone.octave - firstOctave;
    const displayNote: ExerciseDisplayNote = {
      collectionPosition,
      columnIndex: tone.columnIndex,
      intervalLabel: tone.intervalLabel,
      isAnchor:
        collectionPosition >= firstPosition &&
        collectionPosition <= lastPosition,
      key: `position-${collectionPosition}`,
      label: noteNames[tone.collectionIndex] ?? "",
      midi,
      rowIndex,
    };

    mutableDisplayRows[rowIndex]?.push(displayNote);
  });
  const displayRows = mutableDisplayRows.map((row) =>
    row.toSorted((left, right) => left.midi - right.midi),
  );
  const displayNotes = displayRows.flat();
  const notes = displayNotes.filter((note) => note.isAnchor);
  const lastAnchorOctave =
    getCollectionToneAtPosition(resolvedCollectionKey, lastPosition)?.octave ??
    firstOctave;
  const rows = Array.from(
    { length: lastAnchorOctave - firstOctave + 1 },
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
    lastPosition,
    notes,
    rows,
    steps,
    supportsOctaveRangeEditing: toneSequence.supportsOctaveRangeEditing,
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
