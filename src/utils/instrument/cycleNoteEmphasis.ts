import { type ActiveNote } from "@/types/instrument-active-note";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";

/**
 * Cycles note emphasis based on the effective state.
 * Cycle: Hidden → Large → Small → Hidden (removes from activeNotes)
 *
 * To ensure every click results in a visual change, the cycle starts from the
 * note's *effective* emphasis (explicit override OR global fallback).
 */
export function cycleNoteEmphasis(
  current: ActiveNote | undefined,
  midi: number,
  globalEmphasis: InstrumentNoteEmphasis = "large",
): ActiveNote | undefined {
  // Determine current effective emphasis.
  // - If note is absent from activeNotes: it's hidden.
  // - If note is present but has no override: it's globalEmphasis.
  // - If note has an override: use it.
  const effective = current?.emphasis ?? (current ? globalEmphasis : "hidden");

  // hidden → large
  if (effective === "hidden") {
    return { midi, emphasis: "large" };
  }

  // large → small
  if (effective === "large") {
    return { ...current, midi, emphasis: "small" };
  }

  // small → hidden (remove from activeNotes by returning undefined)
  // This effectively puts it back under CSS-ancestor control if it's
  // part of the calculated note collection (which won't happen here as
  // we are clearing it from activeNotes).
  return undefined;
}
