import { type ActiveNotes } from "@/types/instrument/shared";
import { cycleNoteEmphasis } from "@/utils/music/cycleNoteEmphasis";

interface ToggleKeyboardNoteParams {
  midi: number;
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
}

/**
 * Toggles a note on the keyboard.
 * Logic: Undefined -> Large -> Small -> Undefined
 */
export function toggleKeyboardNote({
  midi,
  activeNotes,
  onActiveNotesChange,
}: ToggleKeyboardNoteParams) {
  if (!onActiveNotesChange || !activeNotes) return;

  const key = `${midi}`;
  const next = cycleNoteEmphasis(activeNotes[key], midi);

  const newNotes = { ...activeNotes };
  if (next) {
    newNotes[key] = next;
  } else {
    delete newNotes[key];
  }

  onActiveNotesChange(newNotes);
}
