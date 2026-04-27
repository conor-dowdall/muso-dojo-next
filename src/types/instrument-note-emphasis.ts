import { type SettingSetter } from "./state";

export type InstrumentNoteEmphasis = "large" | "small" | "hidden";

export type InstrumentNoteEmphasisSetter =
  SettingSetter<InstrumentNoteEmphasis>;

export function isInstrumentNoteEmphasis(
  value: unknown,
): value is InstrumentNoteEmphasis {
  return value === "large" || value === "small" || value === "hidden";
}
