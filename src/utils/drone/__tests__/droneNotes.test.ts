import { describe, expect, it } from "vitest";
import { resolveDroneNotes } from "@/utils/drone/droneNotes";

describe("droneNotes", () => {
  it("resolves exactly the notes from the part root and collection", () => {
    const droneNotes = resolveDroneNotes({
      noteCollectionKey: "major9",
      rootNote: "C",
    });

    expect(droneNotes.rootNote).toBe("C");
    expect(
      droneNotes.notes.map((note) => ({
        interval: note.interval,
        label: note.label,
      })),
    ).toStrictEqual([
      { interval: 0, label: "C" },
      { interval: 4, label: "E" },
      { interval: 7, label: "G" },
      { interval: 11, label: "B" },
      { interval: 14, label: "D" },
    ]);
  });
});
