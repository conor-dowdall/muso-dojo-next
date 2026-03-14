import { type ActiveNotes } from "@/types/instrument/shared";
import { cycleNoteEmphasis } from "@/utils/music/cycleNoteEmphasis";

interface ToggleFretboardNoteParams {
  stringIndex: number;
  fretNumber: number;
  openStringMidi: number;
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
  globalEmphasis?: "large" | "small" | "hidden";
}

/**
 * Toggles a note on the fretboard.
 * Logic: Off -> Global -> Override -> Off
 */
export function toggleFretboardNote({
  stringIndex,
  fretNumber,
  openStringMidi,
  activeNotes,
  onActiveNotesChange,
  globalEmphasis,
}: ToggleFretboardNoteParams) {
  if (!onActiveNotesChange || !activeNotes) return;

  const key = `${stringIndex}-${fretNumber}`;
  const midi = openStringMidi + fretNumber;
  const next = cycleNoteEmphasis(activeNotes[key], midi, globalEmphasis);

  const newNotes = { ...activeNotes };
  if (next) {
    newNotes[key] = next;
  } else {
    delete newNotes[key];
  }

  onActiveNotesChange(newNotes);
}
