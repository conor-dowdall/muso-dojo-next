import {
  conversions,
  isValidNoteCollectionKey,
  normalizeRootNoteString,
  noteCollections,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { isPlayableMidiNote } from "@/audio/pitch";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";

// Middle-register anchor for generated drone pitches; octave controls offset
// from here before the notes are handed to the audio engine.
const DRONE_BASE_PITCH_OCTAVE = 3;
const DRONE_NOTE_INTERVAL_MIN = 0;
const DRONE_NOTE_INTERVAL_MAX = 24;
const DRONE_SEMITONES_PER_OCTAVE = 12;
const DRONE_INTERVAL_STEPS_PER_OCTAVE = 7;

export const DRONE_MIN_OCTAVE_ROWS = 1;
export const DRONE_MAX_OCTAVE_ROWS = 4;
export const DRONE_MIN_OCTAVE_OFFSET = -3;
export const DRONE_MAX_OCTAVE_OFFSET = 3;

export interface DroneNoteButton {
  baseInterval: number;
  baseIntervalLabel: string;
  columnIndex: number;
  interval: number;
  intervalLabel: string;
  key: string;
  label: string;
  midi: number;
  rowIndex: number;
}

export interface ResolvedDroneNotes {
  hasUnplayableNotes: boolean;
  notes: DroneNoteButton[];
  octaveOffset: number;
  rowCount: number;
  rows: DroneNoteButton[][];
  rootNote: RootNote;
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

function resolveOctaveOffset(value: unknown) {
  return clampInteger(
    value,
    0,
    DRONE_MIN_OCTAVE_OFFSET,
    DRONE_MAX_OCTAVE_OFFSET,
  );
}

function getDroneRowIntervalLabel(intervalLabel: string, rowIndex: number) {
  if (rowIndex === 0) {
    return intervalLabel;
  }

  // Drone rows repeat the same collection in higher octaves, so the display
  // label raises the generic interval number by one diatonic octave per row.
  const match = intervalLabel.match(/^([^\d]*)(\d+)$/);

  if (!match) {
    return intervalLabel;
  }

  const [, accidental = "", degree] = match;
  const intervalNumber = Number(degree);

  if (!Number.isFinite(intervalNumber)) {
    return intervalLabel;
  }

  return `${accidental}${intervalNumber + rowIndex * DRONE_INTERVAL_STEPS_PER_OCTAVE}`;
}

function getDisplayMidi(
  rootNote: RootNote,
  interval: number,
  octaveOffset: number,
) {
  const rootInteger = rootNoteToIntegerMap.get(rootNote) ?? 0;
  const midi =
    (DRONE_BASE_PITCH_OCTAVE + 1 + octaveOffset) * 12 +
    rootInteger +
    Math.round(interval);

  return midi;
}

export function resolveDroneNotes({
  noteCollectionKey,
  octaveOffset,
  rowCount,
  rootNote,
}: {
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
  const collectionIntervals: readonly number[] = collection.integers;
  const rootInteger = rootNoteToIntegerMap.get(resolvedRootNote) ?? 0;
  const labels = conversions.rootAndNoteCollection.noteNames.get(
    resolvedRootNote,
    resolvedNoteCollectionKey,
    {
      fillChromatic: true,
      rotateToRootInteger0: true,
    },
  );
  const baseNotes = collectionIntervals
    .map((interval, index) => ({
      baseInterval: Math.round(interval),
      baseIntervalLabel: String(collection.intervals[index] ?? interval),
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
  const seenIntervals = new Set<number>();
  let hasUnplayableNotes = false;
  const rows = Array.from({ length: resolvedRowCount }, (_, rowIndex) => {
    const rowNotes: DroneNoteButton[] = [];

    baseNotes.forEach((baseNote) => {
      const interval =
        baseNote.baseInterval + rowIndex * DRONE_SEMITONES_PER_OCTAVE;

      if (seenIntervals.has(interval)) {
        return;
      }

      seenIntervals.add(interval);

      const midi = getDisplayMidi(
        resolvedRootNote,
        interval,
        resolvedOctaveOffset,
      );

      if (!isPlayableMidiNote(midi)) {
        hasUnplayableNotes = true;
        return;
      }

      const pitchClass = (rootInteger + interval) % DRONE_SEMITONES_PER_OCTAVE;
      const intervalLabel = getDroneRowIntervalLabel(
        baseNote.baseIntervalLabel,
        rowIndex,
      );

      rowNotes.push({
        ...baseNote,
        columnIndex: rowNotes.length,
        interval,
        intervalLabel,
        key: `${rowIndex}:${rowNotes.length}:${interval}`,
        label: labels[pitchClass] ?? "",
        midi,
        rowIndex,
      });
    });

    return rowNotes;
  });
  const notes = rows.flat();

  return {
    hasUnplayableNotes,
    notes,
    octaveOffset: resolvedOctaveOffset,
    rowCount: resolvedRowCount,
    rows,
    rootNote: resolvedRootNote,
  };
}
