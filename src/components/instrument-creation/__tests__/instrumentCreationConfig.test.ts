import { describe, expect, it } from "vitest";
import {
  createDefaultFretboardInstrumentSelection,
  createDefaultKeyboardInstrumentSelection,
  getInstrumentCreationViewportTier,
} from "@/components/instrument-creation/instrumentCreationConfig";

describe("instrument creation responsive defaults", () => {
  it("maps viewport widths to tiny, compact, and regular tiers", () => {
    expect(getInstrumentCreationViewportTier(479, 16)).toBe("tiny");
    expect(getInstrumentCreationViewportTier(480, 16)).toBe("compact");
    expect(getInstrumentCreationViewportTier(1023, 16)).toBe("compact");
    expect(getInstrumentCreationViewportTier(1024, 16)).toBe("regular");
  });

  it("chooses keyboard defaults for each viewport tier", () => {
    expect(createDefaultKeyboardInstrumentSelection("tiny")).toMatchObject({
      range: "keys13",
      midiRange: [60, 72],
    });
    expect(createDefaultKeyboardInstrumentSelection("compact")).toMatchObject({
      range: "keys25",
      midiRange: [48, 72],
    });
    expect(createDefaultKeyboardInstrumentSelection("regular")).toMatchObject({
      range: "keys37",
      midiRange: [36, 72],
    });
  });

  it("chooses fretboard defaults for each viewport tier", () => {
    expect(createDefaultFretboardInstrumentSelection("tiny").fretRange).toEqual(
      [0, 5],
    );
    expect(
      createDefaultFretboardInstrumentSelection("compact").fretRange,
    ).toEqual([0, 9]);
    expect(
      createDefaultFretboardInstrumentSelection("regular").fretRange,
    ).toEqual([0, 12]);
  });
});
