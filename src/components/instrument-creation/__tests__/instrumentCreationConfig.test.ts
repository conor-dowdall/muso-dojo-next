import { describe, expect, it } from "vitest";
import {
  createDefaultInstrumentSelections,
  createDefaultFretboardInstrumentSelection,
  createDefaultKeyboardInstrumentSelection,
  getDefaultInstrumentType,
  getInstrumentCreationDefault,
  getInstrumentCreationViewportTier,
  instrumentCreationDefaultMatchesSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import {
  createInstrumentCreationRangeContext,
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { type MusicPartConfig } from "@/types/session";

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
    const keyboardSelections = createDefaultInstrumentSelections("tiny", {
      instrumentType: "keyboard",
      setup: {
        theme: "studio",
      },
    });
    const fretboardSelections = createDefaultInstrumentSelections("tiny", {
      instrumentType: "fretboard",
      setup: {
        instrument: "bass",
        tuningKey: "bassFiveStringBeadg",
        handedness: "left",
        appearanceSource: "custom",
        theme: "maple",
        inlayPreset: "none",
      },
    });

    expect(
      getDefaultInstrumentType({
        instrumentType: "keyboard",
        setup: { theme: "studio" },
      }),
    ).toBe("keyboard");
    expect(keyboardSelections.keyboardSelection).toMatchObject({
      range: "keys13",
      midiRange: [60, 72],
      theme: "studio",
    });
    expect(fretboardSelections.fretboardSelection).toMatchObject({
      instrument: "bass",
      tuningKey: "bassFiveStringBeadg",
      fretRange: [0, 5],
      handedness: "left",
      appearanceSource: "custom",
      theme: "maple",
      inlayPreset: "none",
    });
  });

  it("uses context ranges before viewport ranges without saving them in setup defaults", () => {
    const selections = createDefaultInstrumentSelections(
      "tiny",
      {
        instrumentType: "fretboard",
        setup: {
          instrument: "bass",
          tuningKey: "bassFiveStringBeadg",
          handedness: "left",
          appearanceSource: "custom",
          theme: "maple",
          inlayPreset: "none",
        },
      },
      {
        keyboard: {
          range: "keys37",
          midiRange: [36, 72],
        },
        fretboard: {
          fretRange: [0, 12],
        },
      },
    );

    expect(selections.keyboardSelection).toMatchObject({
      range: "keys37",
      midiRange: [36, 72],
    });
    expect(selections.fretboardSelection).toMatchObject({
      instrument: "bass",
      fretRange: [0, 12],
      handedness: "left",
    });
    expect(
      getInstrumentCreationDefault(
        "fretboard",
        selections.keyboardSelection,
        selections.fretboardSelection,
      ).setup,
    ).not.toHaveProperty("fretRange");
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
      instrumentType: "keyboard",
      setup: {
        theme: "inverted",
      },
    });
    expect(fretboardDefault.setup).not.toHaveProperty("fretRange");
    expect(fretboardDefault).toMatchObject({
      instrumentType: "fretboard",
      setup: {
        instrument: "guitar",
        tuningKey: "guitarStandardE",
        handedness: "left",
      },
    });
  });

  it("checks whether the current setup is already remembered", () => {
    const keyboardDefault = {
      instrumentType: "keyboard",
      setup: { theme: "studio" },
    } as const;
    const selections = createDefaultInstrumentSelections(
      "regular",
      keyboardDefault,
    );

    expect(
      instrumentCreationDefaultMatchesSelection(
        "keyboard",
        keyboardDefault,
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(true);
    expect(
      instrumentCreationDefaultMatchesSelection(
        "keyboard",
        { instrumentType: "keyboard", setup: { theme: "classic" } },
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(false);
    expect(
      instrumentCreationDefaultMatchesSelection(
        "fretboard",
        keyboardDefault,
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(false);
  });

  it("treats the built-in fretboard as the default setup when no preference is saved", () => {
    const selections = createDefaultInstrumentSelections("regular");

    expect(getDefaultInstrumentType()).toBe("fretboard");
    expect(
      instrumentCreationDefaultMatchesSelection(
        "fretboard",
        undefined,
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(true);
  });

  it("creates range context from the most recent same-type instruments", () => {
    const parts = [
      {
        id: "part-1",
        rootNote: "C",
        noteCollectionKey: "major",
        modules: [
          {
            id: "module-1",
            type: "instrument",
            instrument: {
              type: "fretboard",
              config: {
                fretRange: [0, 9],
              },
            },
          },
          {
            id: "module-2",
            type: "instrument",
            instrument: {
              type: "keyboard",
              range: "keys25",
            },
          },
        ],
      },
      {
        id: "part-2",
        rootNote: "D",
        noteCollectionKey: "minor",
        modules: [
          {
            id: "module-3",
            type: "instrument",
            instrument: {
              type: "keyboard",
              config: {
                midiRange: [36, 84],
              },
            },
          },
          {
            id: "module-4",
            type: "instrument",
            instrument: {
              type: "fretboard",
              config: {
                fretRange: [0, 5],
              },
            },
          },
        ],
      },
    ] satisfies MusicPartConfig[];

    const expectedContext = {
      keyboard: {
        range: "keys49",
        midiRange: [36, 84],
      },
      fretboard: {
        fretRange: [0, 5],
      },
    };
    const signature = createInstrumentCreationRangeContextSignature(parts);

    expect(createInstrumentCreationRangeContext(parts)).toEqual(
      expectedContext,
    );
    expect(
      createInstrumentCreationRangeContextFromSignature(signature),
    ).toEqual(expectedContext);
  });

  it("uses built-in ranges when context instruments omit persisted range data", () => {
    const parts = [
      {
        id: "part-1",
        rootNote: "C",
        noteCollectionKey: "major",
        modules: [
          {
            id: "module-1",
            type: "instrument",
            instrument: {
              type: "keyboard",
            },
          },
          {
            id: "module-2",
            type: "instrument",
            instrument: {
              type: "fretboard",
            },
          },
        ],
      },
    ] satisfies MusicPartConfig[];

    expect(createInstrumentCreationRangeContext(parts)).toEqual({
      keyboard: {
        range: "keys25",
        midiRange: [48, 72],
      },
      fretboard: {
        fretRange: [0, 12],
      },
    });
  });
});
