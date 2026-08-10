import { describe, expect, it } from "vitest";
import { getKeyboardActiveNotes } from "@/utils/keyboard/getKeyboardActiveNotes";

describe("getKeyboardActiveNotes", () => {
  it("selects collection tones across the inclusive MIDI range", () => {
    const notes = getKeyboardActiveNotes({
      midiRange: [60, 72],
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(Object.keys(notes)).toEqual([
      "60",
      "62",
      "64",
      "65",
      "67",
      "69",
      "71",
      "72",
    ]);
    expect(notes[72]).toEqual({ midi: 72 });
  });

  it("uses the supplied interactive range, including an extended edge key", () => {
    const notes = getKeyboardActiveNotes({
      midiRange: [59, 61],
      noteCollectionKey: "chromatic",
      rootNote: "C",
    });

    expect(notes).toEqual({
      "59": { midi: 59 },
      "60": { midi: 60 },
      "61": { midi: 61 },
    });
  });
});
