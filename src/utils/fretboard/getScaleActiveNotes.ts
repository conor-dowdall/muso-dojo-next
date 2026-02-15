import {
  noteCollections,
  normalizeRootNoteString,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { type ActiveNotes } from "@/types/fretboard/fretboard";
import { getNumFrets } from "./getNumFrets";

interface GetScaleActiveNotesProps {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  tuning: readonly number[];
  fretRange: [number, number];
}

export function getScaleActiveNotes({
  rootNote: rawRootNote,
  noteCollectionKey,
  tuning,
  fretRange,
}: GetScaleActiveNotesProps): ActiveNotes {
  const activeNotes: ActiveNotes = {};

  // 1. Normalize Root Note
  const rootNote = normalizeRootNoteString(rawRootNote);
  if (!rootNote) return activeNotes;

  // 2. Get Scale Data
  const collection = noteCollections[noteCollectionKey];
  if (!collection) return activeNotes;

  // We need the root note's integer value (C=0, C#=1, etc.)
  const rootInteger = rootNoteToIntegerMap.get(rootNote);
  if (rootInteger === undefined) return activeNotes;

  // Calculate target integers for the scale (modulo 12)
  const scaleIntegers = collection.integers.map(
    (interval: number) => (rootInteger + interval) % 12,
  );
  const scaleIntegersSet = new Set(scaleIntegers);

  // 3. Iterate Fretboard
  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];

  tuning.forEach((openStringMidi, stringIndex) => {
    for (let i = 0; i < numFrets; i++) {
      const fretNumber = startFret + i;
      const noteMidi = openStringMidi + fretNumber;
      const noteInteger = noteMidi % 12;

      if (scaleIntegersSet.has(noteInteger)) {
        const key = `${stringIndex}-${fretNumber}`;
        activeNotes[key] = {
          midi: noteMidi,
          emphasis: "large",
        };
      }
    }
  });

  return activeNotes;
}
