import {
  noteCollections,
  normalizeRootNoteString,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { type ActiveNotes } from "@/types/instrument/shared";

interface GetKeyboardActiveNotesProps {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  midiRange: [number, number];
}

/**
 * Generates active notes for a keyboard across a MIDI range.
 * Similar to getScaleActiveNotes for fretboard but works in 1D (MIDI values only).
 */
export function getKeyboardActiveNotes({
  rootNote: rawRootNote,
  noteCollectionKey,
  midiRange,
}: GetKeyboardActiveNotesProps): ActiveNotes {
  const activeNotes: ActiveNotes = {};

  const rootNote = normalizeRootNoteString(rawRootNote);
  if (!rootNote) return activeNotes;

  const collection = noteCollections[noteCollectionKey];
  if (!collection) return activeNotes;

  const rootInteger = rootNoteToIntegerMap.get(rootNote);
  if (rootInteger === undefined) return activeNotes;

  const scaleIntegers = collection.integers.map(
    (interval: number) => (rootInteger + interval) % 12,
  );
  const scaleIntegersSet = new Set(scaleIntegers);

  const [startMidi, endMidi] = midiRange;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const noteInteger = midi % 12;
    if (scaleIntegersSet.has(noteInteger)) {
      const key = `${midi}`;
      activeNotes[key] = {
        midi,
        emphasis: "large",
      };
    }
  }

  return activeNotes;
}
