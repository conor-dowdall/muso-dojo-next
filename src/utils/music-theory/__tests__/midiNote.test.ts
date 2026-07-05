import { describe, expect, it } from "vitest";
import {
  formatMidiNote,
  formatNoteNameWithMidiOctave,
  getScientificPitchOctaveForMidiNote,
} from "@/utils/music-theory/midiNote";

describe("midiNote", () => {
  it("uses scientific pitch octave numbering", () => {
    expect(getScientificPitchOctaveForMidiNote(60)).toBe(4);
    expect(formatMidiNote(60)).toBe("C4");
  });

  it("formats unknown enharmonic pitch classes with flat note names", () => {
    expect(formatMidiNote(61)).toBe("D♭4");
    expect(formatMidiNote(70)).toBe("B♭4");
  });

  it("preserves a collection-derived spelling", () => {
    expect(formatNoteNameWithMidiOctave("E♯", 65)).toBe("E♯4");
    expect(formatNoteNameWithMidiOctave("", 65)).toBe("");
  });
});
