import { type ActiveNotes, type ActiveNote } from "@/types/fretboard";

interface ToggleFretboardNoteParams {
  stringIndex: number;
  fretNumber: number;
  openStringMidi: number;
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
}

/**
 * Toggles a note on the fretboard.
 * Logic: Undefined -> Large -> Small -> Undefined
 */
export function toggleFretboardNote({
  stringIndex,
  fretNumber,
  openStringMidi,
  activeNotes,
  onActiveNotesChange,
}: ToggleFretboardNoteParams) {
  if (!onActiveNotesChange || !activeNotes) return;

  const key = `${stringIndex}-${fretNumber}`;
  const current = activeNotes[key];
  let next: ActiveNote | undefined = undefined;

  if (!current) {
    next = {
      midi: openStringMidi + fretNumber,
      emphasis: "large",
    };
  } else if (current.emphasis === "large") {
    next = { ...current, emphasis: "small" };
  }

  const newNotes = { ...activeNotes };
  if (next) {
    newNotes[key] = next;
  } else {
    delete newNotes[key];
  }

  onActiveNotesChange(newNotes);
}
