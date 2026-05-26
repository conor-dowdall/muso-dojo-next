import { type ActiveNotes } from "@/types/instrument-active-note";

export function createActiveNotesLockSnapshot(
  activeNotes: ActiveNotes,
): ActiveNotes {
  const snapshot: ActiveNotes = {};

  Object.entries(activeNotes).forEach(([key, note]) => {
    snapshot[key] = {
      midi: note.midi,
      ...(note.emphasis ? { emphasis: note.emphasis } : {}),
    };
  });

  return snapshot;
}
