import { type SettingSetter } from "./state";

export type InstrumentNoteInteractionMode =
  "play" | "edit-one" | "edit-pitch-class";

export type InstrumentNoteInteractionModeSetter =
  SettingSetter<InstrumentNoteInteractionMode>;

export interface InstrumentNoteInteractionTarget {
  key: string;
  midi: number;
  pitchClass: number;
}

export interface InstrumentNoteInteractionOptions {
  moveFocus?: boolean;
}
