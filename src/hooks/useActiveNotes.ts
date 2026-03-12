import { useState } from "react";
import { type ActiveNotes } from "@/types/instrument/shared";

/**
 * Smart uncontrolled pattern for active notes.
 * If the parent provides `externalActiveNotes`, we are controlled.
 * Otherwise, we manage our own state and recalculate when dependencies change.
 *
 * @param externalActiveNotes - Controlled active notes from parent (if any)
 * @param externalOnChange - Controlled change handler from parent (if any)
 * @param dependencies - A string key representing the current musical context
 *   (e.g. `${rootNote}-${scale}-${tuning}`). When this changes, internal state
 *   is recalculated via `recalculate`.
 * @param recalculate - A function that returns new ActiveNotes when dependencies change.
 *   Only called when uncontrolled.
 */
export function useActiveNotes(
  externalActiveNotes: ActiveNotes | undefined,
  externalOnChange: ((notes: ActiveNotes) => void) | undefined,
  dependencies: string,
  recalculate: () => ActiveNotes,
): [ActiveNotes, (notes: ActiveNotes) => void] {
  const isControlled = externalActiveNotes !== undefined;
  const [internalActiveNotes, setInternalActiveNotes] = useState<ActiveNotes>(
    {},
  );

  // Track dependencies to derive state whenever musical context changes.
  // This avoids `useEffect` double-renders by updating state directly during the render phase.
  const [prevDependencies, setPrevDependencies] = useState("");

  if (dependencies !== prevDependencies) {
    setPrevDependencies(dependencies);

    // Only auto-calculate notes if we are managing our own state.
    if (!isControlled) {
      setInternalActiveNotes(recalculate());
    }
  }

  const activeNotes = isControlled ? externalActiveNotes : internalActiveNotes;
  const onActiveNotesChange = isControlled
    ? externalOnChange!
    : setInternalActiveNotes;

  return [activeNotes, onActiveNotesChange];
}
