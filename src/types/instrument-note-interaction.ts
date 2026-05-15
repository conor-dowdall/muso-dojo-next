import { type SettingSetter } from "./state";

export type InstrumentNoteInteractionMode = "play" | "edit-note";

export type InstrumentNoteInteractionModeSetter =
  SettingSetter<InstrumentNoteInteractionMode>;

export interface InstrumentNoteInteractionTarget {
  key: string;
  midi: number;
  pitchClass: number;
}
