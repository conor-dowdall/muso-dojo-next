import {
  type ActiveNotes,
  type ActiveNotesValue,
} from "@/types/instrument-active-note";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { cycleNoteEmphasis } from "@/utils/instrument/cycleNoteEmphasis";

export type InstrumentNoteEditScope = "one" | "pitch-class";

interface ApplyInstrumentNoteEditParams {
  activeNotes: ActiveNotesValue;
  allTargets?: readonly InstrumentNoteInteractionTarget[];
  globalEmphasis?: InstrumentNoteEmphasis;
  scope: InstrumentNoteEditScope;
  target: InstrumentNoteInteractionTarget;
}

export function applyInstrumentNoteEdit({
  activeNotes,
  allTargets = [],
  globalEmphasis,
  scope,
  target,
}: ApplyInstrumentNoteEditParams): ActiveNotes {
  const notes = activeNotes ?? {};
  const nextNotes = { ...notes };
  const nextTargetNote = cycleNoteEmphasis(
    notes[target.key],
    target.midi,
    globalEmphasis,
  );

  if (scope === "one") {
    if (nextTargetNote) {
      nextNotes[target.key] = nextTargetNote;
    } else {
      delete nextNotes[target.key];
    }

    return nextNotes;
  }

  const targets = allTargets.length > 0 ? allTargets : [target];
  const pitchClassTargets = targets.filter(
    (candidateTarget) => candidateTarget.pitchClass === target.pitchClass,
  );

  pitchClassTargets.forEach((candidateTarget) => {
    if (nextTargetNote) {
      nextNotes[candidateTarget.key] = {
        midi: candidateTarget.midi,
        emphasis: nextTargetNote.emphasis,
      };
    } else {
      delete nextNotes[candidateTarget.key];
    }
  });

  return nextNotes;
}
