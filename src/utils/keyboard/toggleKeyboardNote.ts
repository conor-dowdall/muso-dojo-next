import { type ActiveNotes } from "@/types/instrument/shared";
import { cycleNoteEmphasis } from "@/utils/music/cycleNoteEmphasis";

interface ToggleKeyboardNoteParams {
  midi: number;
  activeNotes?: ActiveNotes;
  onActiveNotesChange?: (notes: ActiveNotes) => void;
  globalEmphasis?: "large" | "small" | "hidden";
}

/**
 * Toggles a note on the keyboard.
 * Logic: Off -> Global -> Override -> Off
 */
export function toggleKeyboardNote({
  midi,
  activeNotes,
  onActiveNotesChange,
  globalEmphasis,
}: ToggleKeyboardNoteParams) {
  if (!onActiveNotesChange || !activeNotes) return;

  const key = `${midi}`;
  const next = cycleNoteEmphasis(activeNotes[key], midi, globalEmphasis);

  const newNotes = { ...activeNotes };
  if (next) {
    newNotes[key] = next;
  } else {
    delete newNotes[key];
  }

  onActiveNotesChange(newNotes);
}
