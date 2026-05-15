import { type InstrumentNoteInteractionTarget } from "@/types/instrument";

export function createInstrumentNoteInteractionTarget(
  key: string,
  midi: number,
): InstrumentNoteInteractionTarget {
  return {
    key,
    midi,
    pitchClass: ((midi % 12) + 12) % 12,
  };
}
