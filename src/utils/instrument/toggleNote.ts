import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { cycleNoteEmphasis } from "@/utils/instrument/cycleNoteEmphasis";

interface ToggleNoteParams {
  key: string;
  midi: number;
  onActiveNotesChange?: ActiveNotesSetter;
  globalEmphasis?: InstrumentNoteEmphasis;
}

/**
 * Unified utility for toggling notes on any instrument.
 * Cycle: Hidden → Large → Small → Hidden (with awareness of global default)
 */
export function toggleNote({
  key,
  midi,
  onActiveNotesChange,
  globalEmphasis,
}: ToggleNoteParams) {
  if (!onActiveNotesChange) return;

  const performToggle = (
    currentNotes: ActiveNotes | undefined,
  ): ActiveNotes => {
    const notes = currentNotes ?? {};
    const next = cycleNoteEmphasis(notes[key], midi, globalEmphasis);
    const newNotes = { ...notes };
    if (next) {
      newNotes[key] = next;
    } else {
      delete newNotes[key];
    }
    return newNotes;
  };

  onActiveNotesChange(performToggle);
}
