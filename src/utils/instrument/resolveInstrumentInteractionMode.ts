import { type InstrumentNoteInteractionMode } from "@/types/instrument";

interface ResolveInstrumentNoteInteractionModeParams {
  activeNotesLocked: boolean;
  noteInteractionMode: InstrumentNoteInteractionMode;
}

export function resolveInstrumentNoteInteractionMode({
  activeNotesLocked,
  noteInteractionMode,
}: ResolveInstrumentNoteInteractionModeParams): InstrumentNoteInteractionMode {
  return activeNotesLocked ? "play" : noteInteractionMode;
}
