import { describe, expect, it } from "vitest";
import { createDefaultFretboardInstrumentSelection } from "@/components/instrument-creation/instrumentCreationConfig";
import {
  formatFretboardCreationSummary,
  formatFretboardDefaultSetupSummary,
  formatKeyboardDefaultSetupSummary,
} from "@/components/instrument-creation/instrumentCreationCopy";

describe("instrument creation copy", () => {
  it("shows fret range while creating a fretboard but not when saving the default setup", () => {
    const selection = createDefaultFretboardInstrumentSelection("compact");

    expect(formatFretboardCreationSummary(selection)).toBe(
      "Guitar • Standard E • Frets 0 to 9",
    );
    expect(formatFretboardDefaultSetupSummary(selection)).toBe(
      "Guitar • Standard E",
    );
  });

  it("keeps left-handed fretboards clear without implying fret range is saved", () => {
    const selection = {
      ...createDefaultFretboardInstrumentSelection("tiny"),
      handedness: "left",
    } as const;

    expect(formatFretboardCreationSummary(selection)).toBe(
      "Guitar • Standard E • Left-Handed • Frets 0 to 5",
    );
    expect(formatFretboardDefaultSetupSummary(selection)).toBe(
      "Guitar • Standard E • Left-Handed",
    );
  });

  it("keeps keyboard default setup copy range-free", () => {
    expect(formatKeyboardDefaultSetupSummary()).toBe("Keyboard");
  });
});
