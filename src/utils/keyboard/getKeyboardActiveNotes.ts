import {
  getNoteCollectionPitchClasses,
  normalizeChromaticIndex,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { type ActiveNotes } from "@/types/instrument-active-note";

interface GetKeyboardActiveNotesProps {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  midiRange: readonly [number, number];
}

/**
 * Generates active notes for a keyboard across a MIDI range.
 * Similar to getFretboardActiveNotes for fretboard but works in 1D (MIDI values only).
 */
const cache = new Map<string, ActiveNotes>();

export function getKeyboardActiveNotes({
  rootNote,
  noteCollectionKey,
  midiRange,
}: GetKeyboardActiveNotesProps): ActiveNotes {
  const cacheKey = JSON.stringify({
    rootNote,
    noteCollectionKey,
    midiRange,
  });
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const activeNotes: ActiveNotes = {};

  const pitchClasses = getNoteCollectionPitchClasses({
    rootNote,
    noteCollectionKey,
  });
  if (!pitchClasses) return activeNotes;

  const [startMidi, endMidi] = midiRange;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const noteInteger = normalizeChromaticIndex(midi);
    if (pitchClasses.has(noteInteger)) {
      const key = `${midi}`;
      activeNotes[key] = {
        midi,
      };
    }
  }

  cache.set(cacheKey, activeNotes);
  return activeNotes;
}
