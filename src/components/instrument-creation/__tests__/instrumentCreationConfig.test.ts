import { describe, expect, it } from "vitest";
import {
  createDefaultInstrumentSelections,
  createDefaultFretboardInstrumentSelection,
  createDefaultKeyboardInstrumentSelection,
  getInstrumentCreationDefault,
  getInstrumentCreationViewportTier,
  instrumentCreationDefaultMatchesSelection,
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

  it("applies remembered setup defaults without overriding responsive ranges", () => {
    const selections = createDefaultInstrumentSelections("tiny", {
      keyboard: {
        theme: "studio",
      },
      fretboard: {
        instrument: "bass",
        tuningKey: "bassFiveStringBeadg",
        handedness: "left",
        appearanceSource: "custom",
        theme: "maple",
        inlayPreset: "none",
      },
    });

    expect(selections.keyboardSelection).toMatchObject({
      range: "keys13",
      midiRange: [60, 72],
      theme: "studio",
    });
    expect(selections.fretboardSelection).toMatchObject({
      instrument: "bass",
      tuningKey: "bassFiveStringBeadg",
      fretRange: [0, 5],
      handedness: "left",
      appearanceSource: "custom",
      theme: "maple",
      inlayPreset: "none",
    });
  });

  it("creates remembered setup defaults without range settings", () => {
    const selections = createDefaultInstrumentSelections("regular");
    const keyboardDefault = getInstrumentCreationDefault(
      "keyboard",
      {
        ...selections.keyboardSelection,
        range: "custom",
        midiRange: [48, 96],
        theme: "inverted",
      },
      selections.fretboardSelection,
    );
    const fretboardDefault = getInstrumentCreationDefault(
      "fretboard",
      selections.keyboardSelection,
      {
        ...selections.fretboardSelection,
        fretRange: [0, 24],
        handedness: "left",
      },
    );

    expect(keyboardDefault).toEqual({
      theme: "inverted",
    });
    expect(fretboardDefault).not.toHaveProperty("fretRange");
    expect(fretboardDefault).toMatchObject({
      instrument: "guitar",
      tuningKey: "guitarStandardE",
      handedness: "left",
    });
  });

  it("checks whether the current setup is already remembered", () => {
    const selections = createDefaultInstrumentSelections("regular", {
      keyboard: { theme: "studio" },
    });

    expect(
      instrumentCreationDefaultMatchesSelection(
        "keyboard",
        { keyboard: { theme: "studio" } },
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(true);
    expect(
      instrumentCreationDefaultMatchesSelection(
        "keyboard",
        { keyboard: { theme: "classic" } },
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(false);
  });
});
