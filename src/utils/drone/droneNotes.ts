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

const DRONE_NOTE_DISPLAY_OCTAVE = 3;
const DRONE_NOTE_INTERVAL_MIN = 0;
const DRONE_NOTE_INTERVAL_MAX = 24;

export interface DroneNoteButton {
  interval: number;
  label: string;
  midi: number;
}

export interface ResolvedDroneNotes {
  notes: DroneNoteButton[];
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

function getDisplayMidi(rootNote: RootNote, interval: number) {
  const rootInteger = rootNoteToIntegerMap.get(rootNote) ?? 0;
  const midi =
    (DRONE_NOTE_DISPLAY_OCTAVE + 1) * 12 + rootInteger + Math.round(interval);

  return isPlayableMidiNote(midi) ? midi : 60;
}

export function resolveDroneNotes({
  noteCollectionKey,
  rootNote,
}: {
  noteCollectionKey?: unknown;
  rootNote?: unknown;
}): ResolvedDroneNotes {
  const resolvedRootNote = resolveRootNote(rootNote);
  const resolvedNoteCollectionKey = resolveNoteCollectionKey(noteCollectionKey);
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
  const notes = collectionIntervals
    .map((interval) => Math.round(interval))
    .filter(
      (interval) =>
        interval >= DRONE_NOTE_INTERVAL_MIN &&
        interval <= DRONE_NOTE_INTERVAL_MAX,
    )
    .map((interval) => {
      const pitchClass = (rootInteger + interval) % 12;

      return {
        interval,
        label: labels[pitchClass] ?? "",
        midi: getDisplayMidi(resolvedRootNote, interval),
      } satisfies DroneNoteButton;
    })
    .filter((note, index, allNotes) => {
      return (
        allNotes.findIndex((other) => other.interval === note.interval) ===
        index
      );
    });

  return {
    notes,
    rootNote: resolvedRootNote,
  };
}
