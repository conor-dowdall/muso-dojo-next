import {
  type ActiveNotes,
  type ActiveNotesSetter,
} from "@/types/instrument-active-note";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { cycleNoteEmphasis } from "@/utils/instrument/cycleNoteEmphasis";

interface ToggleIndividualNoteEmphasisParams {
  target: InstrumentNoteInteractionTarget;
  onActiveNotesChange?: ActiveNotesSetter;
  globalEmphasis?: InstrumentNoteEmphasis;
}

/**
 * Edits one instrument note cell without affecting pitch-class or unison matches.
 * Cycle: Hidden → Large → Small → Hidden (with awareness of global default)
 */
export function toggleIndividualNoteEmphasis({
  target,
  onActiveNotesChange,
  globalEmphasis,
}: ToggleIndividualNoteEmphasisParams) {
  if (!onActiveNotesChange) return;

  const performToggle = (
    currentNotes: ActiveNotes | undefined,
  ): ActiveNotes => {
    const { key, midi } = target;
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
