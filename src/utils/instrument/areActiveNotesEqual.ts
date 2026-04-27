import { type ActiveNotes } from "@/types/instrument-active-note";

/**
 * Checks if two ActiveNotes objects are functionally identical.
 */
export function areActiveNotesEqual(a: ActiveNotes, b: ActiveNotes): boolean {
  if (!a || !b) return a === b;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valA = a[key];
    const valB = b[key];

    if (!valB) return false;
    if (valA.midi !== valB.midi) return false;
    if (valA.emphasis !== valB.emphasis) return false;
  }

  return true;
}
