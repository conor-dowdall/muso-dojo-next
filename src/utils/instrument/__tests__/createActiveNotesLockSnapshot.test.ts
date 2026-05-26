import { describe, expect, it } from "vitest";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { createActiveNotesLockSnapshot } from "@/utils/instrument/createActiveNotesLockSnapshot";

describe("createActiveNotesLockSnapshot", () => {
  it("preserves only explicit per-note emphasis overrides", () => {
    const activeNotes = {
      c4: { midi: 60 },
      e4: { midi: 64, emphasis: "small" },
      g4: { midi: 67, emphasis: "hidden" },
    } satisfies ActiveNotes;

    expect(createActiveNotesLockSnapshot(activeNotes)).toEqual({
      c4: { midi: 60 },
      e4: { midi: 64, emphasis: "small" },
      g4: { midi: 67, emphasis: "hidden" },
    });
  });

  it("returns a detached snapshot", () => {
    const activeNotes = {
      c4: { midi: 60 },
    } satisfies ActiveNotes;
    const snapshot = createActiveNotesLockSnapshot(activeNotes);

    expect(snapshot).not.toBe(activeNotes);
    expect(snapshot.c4).not.toBe(activeNotes.c4);
  });
});
