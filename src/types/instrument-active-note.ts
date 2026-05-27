import { type InstrumentNoteEmphasis } from "./instrument-note-emphasis";
import { type SettingSetter } from "./state";

export interface ActiveNote {
  midi: number;
  emphasis?: InstrumentNoteEmphasis;
}

export type ActiveNotes = Record<string, ActiveNote>;

export type ActiveNotesSourceKey = string;

export interface ActiveNotesLockSnapshot {
  activeNotes: ActiveNotes;
  sourceKey: ActiveNotesSourceKey;
}

export type ActiveNotesValue = ActiveNotes | undefined;

export type ActiveNotesSetter = SettingSetter<ActiveNotesValue>;
