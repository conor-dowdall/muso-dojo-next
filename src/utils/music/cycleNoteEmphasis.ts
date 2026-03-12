import { type ActiveNote } from "@/types/instrument/shared";

/**
 * Cycles note emphasis: undefined → large → small → undefined.
 * Returns the next ActiveNote state, or undefined to remove the note.
 */
export function cycleNoteEmphasis(
  current: ActiveNote | undefined,
  midi: number,
): ActiveNote | undefined {
  if (!current) {
    return { midi, emphasis: "large" };
  } else if (current.emphasis === "large") {
    return { ...current, emphasis: "small" };
  }
  return undefined;
}
