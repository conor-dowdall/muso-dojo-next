import { type ActiveNote } from "@/types/instrument/shared";

/**
 * Cycles note emphasis: undefined → large → small → undefined.
 * Returns the next ActiveNote state, or undefined to remove the note.
 */
export function cycleNoteEmphasis(
  current: ActiveNote | undefined,
  midi: number,
  globalEmphasis: "large" | "small" | "hidden" = "large",
): ActiveNote | undefined {
  // 1. If not active, toggle on.
  if (!current) {
    // If global is hidden, make it large so it's visible.
    // If it's already large/small, follow global.
    if (globalEmphasis === "hidden") return { midi, emphasis: "large" };
    return { midi };
  }

  // 2. If it's using the global default (no explicit emphasis)
  if (current.emphasis === undefined) {
    if (globalEmphasis === "large") return { ...current, emphasis: "small" };
    // For small or hidden, makes it large as the first override.
    return { ...current, emphasis: "large" };
  }

  // 3. Cycle through explicit states
  if (current.emphasis === "large") return { ...current, emphasis: "small" };
  if (current.emphasis === "small") return { ...current, emphasis: "hidden" };

  // 4. From "hidden", return undefined (reset to global or remove)
  return undefined;
}
