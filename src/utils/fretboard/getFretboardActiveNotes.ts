import { type NoteCollectionKey } from "@musodojo/music-theory-data";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { getNumFrets } from "@/utils/fretboard/fretboardGeometry";
import { getNoteCollectionPitchClasses } from "@/utils/music-theory/getNoteCollectionPitchClasses";

interface GetFretboardActiveNotesProps {
  rootNote: string;
  noteCollectionKey: NoteCollectionKey;
  tuning: readonly number[];
  fretRange: [number, number];
}

const cache = new Map<string, ActiveNotes>();

export function getFretboardActiveNotes({
  rootNote,
  noteCollectionKey,
  tuning,
  fretRange,
}: GetFretboardActiveNotesProps): ActiveNotes {
  const cacheKey = JSON.stringify({
    rootNote,
    noteCollectionKey,
    tuning,
    fretRange,
  });
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const activeNotes: ActiveNotes = {};

  const pitchClasses = getNoteCollectionPitchClasses({
    rootNote,
    noteCollectionKey,
  });
  if (!pitchClasses) return activeNotes;

  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];

  tuning.forEach((openStringMidi, stringIndex) => {
    for (let i = 0; i < numFrets; i++) {
      const fretNumber = startFret + i;
      const noteMidi = openStringMidi + fretNumber;
      const noteInteger = noteMidi % 12;

      if (pitchClasses.has(noteInteger)) {
        const key = `${stringIndex}-${fretNumber}`;
        activeNotes[key] = {
          midi: noteMidi,
        };
      }
    }
  });

  cache.set(cacheKey, activeNotes);
  return activeNotes;
}
