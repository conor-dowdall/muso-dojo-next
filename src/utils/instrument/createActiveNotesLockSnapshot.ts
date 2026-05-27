import {
  type ActiveNotes,
  type ActiveNotesLockSnapshot,
  type ActiveNotesSourceKey,
} from "@/types/instrument-active-note";

export function createActiveNotesLockSnapshot(
  activeNotes: ActiveNotes,
  sourceKey: ActiveNotesSourceKey,
): ActiveNotesLockSnapshot {
  const snapshot: ActiveNotes = {};

  Object.entries(activeNotes).forEach(([key, note]) => {
    snapshot[key] = {
      midi: note.midi,
      ...(note.emphasis ? { emphasis: note.emphasis } : {}),
    };
  });

  return {
    activeNotes: snapshot,
    sourceKey,
  };
}
