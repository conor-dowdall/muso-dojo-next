import { type ActiveNotes } from "@/types/instrument-active-note";
import { isInstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMidi(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const midi = Math.round(value);
  return midi >= 0 && midi <= 127 ? midi : undefined;
}

export function normalizeActiveNotes(value: unknown): ActiveNotes | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const activeNotes: ActiveNotes = {};
  const entries = Object.entries(value);

  // An empty override means the user intentionally hid every generated note.
  if (entries.length === 0) {
    return activeNotes;
  }

  entries.forEach(([key, note]) => {
    if (!isRecord(note)) {
      return;
    }

    const midi = normalizeMidi(note.midi);
    if (midi === undefined) {
      return;
    }

    activeNotes[key] = {
      midi,
      ...(isInstrumentNoteEmphasis(note.emphasis)
        ? { emphasis: note.emphasis }
        : {}),
    };
  });

  return Object.keys(activeNotes).length > 0 ? activeNotes : undefined;
}
