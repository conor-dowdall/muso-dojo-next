import { describe, expect, it } from "vitest";
import { getFretboardActiveNotes } from "@/utils/fretboard/getFretboardActiveNotes";

describe("getFretboardActiveNotes", () => {
  it("selects collection tones independently on every rendered string", () => {
    const notes = getFretboardActiveNotes({
      fretRange: [0, 2],
      noteCollectionKey: "ionian",
      rootNote: "C",
      tuning: [60, 64],
    });

    expect(notes).toEqual({
      "0-0": { midi: 60 },
      "0-2": { midi: 62 },
      "1-0": { midi: 64 },
      "1-1": { midi: 65 },
    });
  });

  it("uses absolute fret numbers when the rendered range starts above zero", () => {
    const notes = getFretboardActiveNotes({
      fretRange: [5, 7],
      noteCollectionKey: "chromatic",
      rootNote: "C",
      tuning: [60],
    });

    expect(notes).toEqual({
      "0-5": { midi: 65 },
      "0-6": { midi: 66 },
      "0-7": { midi: 67 },
    });
  });
});
