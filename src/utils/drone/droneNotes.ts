import {
  conversions,
  isValidNoteCollectionKey,
  normalizeRootNoteString,
  noteCollections,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import {
  MUSICAL_SURFACE_MIDI_MAX,
  MUSICAL_SURFACE_MIDI_MIN,
  isMusicalSurfaceMidiNote,
} from "@/audio/pitch";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";
import {
  getCollectionToneAtPosition,
  getCollectionToneSequenceMetadata,
} from "@/utils/music-theory/collectionToneSequence";

// Middle-register anchor for generated drone pitches; octave controls offset
// from here before the notes are handed to the audio engine.
const DRONE_BASE_PITCH_OCTAVE = 3;
const DRONE_NOTE_INTERVAL_MIN = 0;
const DRONE_NOTE_INTERVAL_MAX = 24;
const DRONE_SEMITONES_PER_OCTAVE = 12;
const DRONE_BASE_ROOT_MIDI =
  (DRONE_BASE_PITCH_OCTAVE + 1) * DRONE_SEMITONES_PER_OCTAVE;

export const DRONE_MIN_OCTAVE_ROWS = 1;
export const DRONE_MAX_OCTAVE_ROWS = 4;
export const DRONE_MIN_NOTE_COUNT = 1;
export const DRONE_MAX_NOTE_COUNT =
  DRONE_SEMITONES_PER_OCTAVE * DRONE_MAX_OCTAVE_ROWS;
export const DRONE_MIN_OCTAVE_OFFSET = Math.ceil(
  (MUSICAL_SURFACE_MIDI_MIN - DRONE_BASE_ROOT_MIDI) /
    DRONE_SEMITONES_PER_OCTAVE,
);
export const DRONE_MAX_OCTAVE_OFFSET = Math.floor(
  (MUSICAL_SURFACE_MIDI_MAX - DRONE_BASE_ROOT_MIDI) /
    DRONE_SEMITONES_PER_OCTAVE,
);

export interface DroneNoteButton {
  baseInterval: number;
  baseIntervalLabel: string;
  collectionDegreeSignature?: string;
  columnIndex: number;
  collectionPosition: number;
  collectionSize: number;
  interval: number;
  intervalDegree?: number;
  intervalLabel: string;
  key: string;
  label: string;
  midi: number;
  rowIndex: number;
}

export interface ResolvedDroneNotes {
  collectionSize: number;
  columnCount: number;
  hasUnplayableNotes: boolean;
  maxNoteCount: number;
  noteCount: number;
  notes: DroneNoteButton[];
  octaveOffset: number;
  rowCount: number;
  rows: DroneNoteButton[][];
  rootNote: RootNote;
  supportsOctaveRangeEditing: boolean;
}

function resolveNoteCollectionKey(value: unknown): NoteCollectionKey {
  return typeof value === "string" && isValidNoteCollectionKey(value)
    ? value
    : DEFAULT_PART_NOTE_COLLECTION_KEY;
}

function resolveRootNote(value: unknown): RootNote {
  return typeof value === "string"
    ? (normalizeRootNoteString(value) ?? DEFAULT_PART_ROOT_NOTE)
    : DEFAULT_PART_ROOT_NOTE;
}

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function resolveRowCount(value: unknown) {
  return clampInteger(
    value,
    DRONE_MIN_OCTAVE_ROWS,
    DRONE_MIN_OCTAVE_ROWS,
    DRONE_MAX_OCTAVE_ROWS,
  );
}

function resolveNoteCount(value: unknown, fallback: number, max: number) {
  return clampInteger(
    value,
    fallback,
    DRONE_MIN_NOTE_COUNT,
    Math.min(DRONE_MAX_NOTE_COUNT, max),
  );
}

function resolveOctaveOffset(value: unknown) {
  return clampInteger(
    value,
    0,
    DRONE_MIN_OCTAVE_OFFSET,
    DRONE_MAX_OCTAVE_OFFSET,
  );
}

function getDisplayMidi(
  rootNote: RootNote,
  interval: number,
  octaveOffset: number,
) {
  const rootInteger = rootNoteToIntegerMap.get(rootNote) ?? 0;
  const midi =
    DRONE_BASE_ROOT_MIDI +
    octaveOffset * DRONE_SEMITONES_PER_OCTAVE +
    rootInteger +
    Math.round(interval);

  return midi;
}

export function resolveDroneNotes({
  noteCount,
  noteCollectionKey,
  octaveOffset,
  rowCount,
  rootNote,
}: {
  noteCount?: unknown;
  noteCollectionKey?: unknown;
  octaveOffset?: unknown;
  rowCount?: unknown;
  rootNote?: unknown;
}): ResolvedDroneNotes {
  const resolvedRootNote = resolveRootNote(rootNote);
  const resolvedNoteCollectionKey = resolveNoteCollectionKey(noteCollectionKey);
  const resolvedOctaveOffset = resolveOctaveOffset(octaveOffset);
  const resolvedRowCount = resolveRowCount(rowCount);
  const collection = noteCollections[resolvedNoteCollectionKey];
  const toneSequence = getCollectionToneSequenceMetadata(
    resolvedNoteCollectionKey,
  );
  const rootInteger = rootNoteToIntegerMap.get(resolvedRootNote) ?? 0;
  const labels = conversions.rootAndNoteCollection.noteNames.get(
    resolvedRootNote,
    resolvedNoteCollectionKey,
    {
      fillChromatic: true,
      rotateToRootInteger0: true,
    },
  );
  const baseNotes = toneSequence.tones
    .map((tone) => ({
      baseInterval: Math.round(tone.semitones),
      baseIntervalLabel: String(
        collection.intervals[tone.collectionIndex] ?? tone.semitones,
      ),
      collectionIndex: tone.collectionIndex,
    }))
    .filter(
      ({ baseInterval }) =>
        baseInterval >= DRONE_NOTE_INTERVAL_MIN &&
        baseInterval <= DRONE_NOTE_INTERVAL_MAX,
    )
    .filter((note, index, allNotes) => {
      return (
        allNotes.findIndex(
          (other) => other.baseInterval === note.baseInterval,
        ) === index
      );
    });
  const baseNoteByCollectionIndex = new Map(
    baseNotes.map((note) => [note.collectionIndex, note]),
  );
  const candidateCount = toneSequence.tones.length * DRONE_MAX_OCTAVE_ROWS;
  const candidates: DroneNoteButton[] = [];

  for (let position = 0; position < candidateCount; position += 1) {
    const tone = getCollectionToneAtPosition(
      resolvedNoteCollectionKey,
      position,
    );

    if (!tone) {
      break;
    }

    const baseNote = baseNoteByCollectionIndex.get(tone.collectionIndex);

    if (!baseNote || tone.octave < 0 || tone.octave >= DRONE_MAX_OCTAVE_ROWS) {
      continue;
    }

    const interval = tone.semitones;
    const midi = getDisplayMidi(
      resolvedRootNote,
      interval,
      resolvedOctaveOffset,
    );
    const pitchClass = (rootInteger + interval) % DRONE_SEMITONES_PER_OCTAVE;

    candidates.push({
      ...baseNote,
      collectionDegreeSignature: toneSequence.degreeSignature,
      columnIndex: tone.columnIndex,
      collectionPosition: position,
      collectionSize: baseNotes.length,
      interval,
      intervalDegree: tone.intervalDegree,
      intervalLabel: tone.intervalLabel,
      key: `position-${position}`,
      label: labels[pitchClass] ?? "",
      midi,
      rowIndex: tone.octave,
    });
  }
  const maxPlayableNoteCount = candidates.findIndex(
    (candidate) => !isMusicalSurfaceMidiNote(candidate.midi),
  );
  const maxNoteCount =
    maxPlayableNoteCount < 0 ? candidates.length : maxPlayableNoteCount;
  const legacyDefaultNoteCount = Math.min(
    candidates.length,
    toneSequence.tones.length * resolvedRowCount,
  );
  const requestedNoteCount = resolveNoteCount(
    noteCount,
    legacyDefaultNoteCount,
    candidates.length,
  );
  const resolvedNoteCount = Math.min(requestedNoteCount, maxNoteCount);
  const visibleNotes = candidates.slice(0, resolvedNoteCount);
  const visibleRowCount =
    visibleNotes.at(-1) === undefined
      ? DRONE_MIN_OCTAVE_ROWS
      : visibleNotes.at(-1)!.rowIndex + 1;
  const rows = Array.from({ length: visibleRowCount }, (_, rowIndex) =>
    visibleNotes
      .filter((note) => note.rowIndex === rowIndex)
      .toSorted((left, right) => left.interval - right.interval),
  );

  const notes = rows.flat();

  return {
    collectionSize: baseNotes.length,
    columnCount: toneSequence.columnCount,
    hasUnplayableNotes: requestedNoteCount > maxNoteCount,
    maxNoteCount,
    noteCount: resolvedNoteCount,
    notes,
    octaveOffset: resolvedOctaveOffset,
    rowCount: visibleRowCount,
    rows,
    rootNote: resolvedRootNote,
    supportsOctaveRangeEditing: toneSequence.supportsOctaveRangeEditing,
  };
}
