import { describe, expect, it } from "vitest";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { createActiveNotesLockSnapshot } from "@/utils/instrument/createActiveNotesLockSnapshot";

describe("createActiveNotesLockSnapshot", () => {
  const sourceKey = '["C","major","64,59,55,50,45,40","0,12"]';

  it("captures the active notes with the source context they belong to", () => {
    const activeNotes = {
      c4: { midi: 60 },
      e4: { midi: 64, emphasis: "small" },
      g4: { midi: 67, emphasis: "hidden" },
    } satisfies ActiveNotes;

    expect(createActiveNotesLockSnapshot(activeNotes, sourceKey)).toEqual({
      activeNotes: {
        c4: { midi: 60 },
        e4: { midi: 64, emphasis: "small" },
        g4: { midi: 67, emphasis: "hidden" },
      },
      sourceKey,
    });
  });

  it("returns a detached snapshot", () => {
    const activeNotes = {
      c4: { midi: 60 },
    } satisfies ActiveNotes;
    const snapshot = createActiveNotesLockSnapshot(activeNotes, sourceKey);

    expect(snapshot.activeNotes).not.toBe(activeNotes);
    expect(snapshot.activeNotes.c4).not.toBe(activeNotes.c4);
  });
});
