import { describe, expect, it } from "vitest";
import { shouldClearPreservedActiveNotesOnUnlock } from "@/hooks/instrument/useActiveNotes";

describe("shouldClearPreservedActiveNotesOnUnlock", () => {
  it("keeps custom notes that were preserved through a locked dependency change", () => {
    const shouldClear = shouldClearPreservedActiveNotesOnUnlock({
      externalActiveNotes: {
        c4: { midi: 60 },
      },
      preserveStaleNotesOnUnlock: true,
    });

    expect(shouldClear).toBe(false);
  });

  it("clears generated snapshots that were preserved only while locked", () => {
    const shouldClear = shouldClearPreservedActiveNotesOnUnlock({
      externalActiveNotes: {
        c4: { midi: 60 },
      },
      preserveStaleNotesOnUnlock: false,
    });

    expect(shouldClear).toBe(true);
  });
});
