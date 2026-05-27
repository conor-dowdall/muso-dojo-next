import { describe, expect, it } from "vitest";
import { shouldClearActiveNotesAfterUnlock } from "@/hooks/instrument/useActiveNotes";

describe("shouldClearActiveNotesAfterUnlock", () => {
  it("keeps custom notes when the musical context did not change while locked", () => {
    const shouldClear = shouldClearActiveNotesAfterUnlock({
      externalActiveNotes: {
        c4: { midi: 60, emphasis: "small" },
      },
      initialActiveNotes: {
        c4: { midi: 60 },
      },
      hadLockedDependencyChange: false,
    });

    expect(shouldClear).toBe(false);
  });

  it("clears notes when the musical context changed while locked", () => {
    const shouldClear = shouldClearActiveNotesAfterUnlock({
      externalActiveNotes: {
        c4: { midi: 60 },
      },
      initialActiveNotes: {
        eb4: { midi: 63 },
      },
      hadLockedDependencyChange: true,
    });

    expect(shouldClear).toBe(true);
  });

  it("clears redundant lock snapshots that match the generated notes", () => {
    const shouldClear = shouldClearActiveNotesAfterUnlock({
      externalActiveNotes: {
        c4: { midi: 60 },
      },
      initialActiveNotes: {
        c4: { midi: 60 },
      },
      hadLockedDependencyChange: false,
    });

    expect(shouldClear).toBe(true);
  });
});
