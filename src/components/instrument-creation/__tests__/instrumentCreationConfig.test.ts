import { describe, expect, it } from "vitest";
import {
  createDefaultInstrumentSelections,
  createDefaultFretboardInstrumentSelection,
  createDefaultKeyboardInstrumentSelection,
  getDefaultInstrumentType,
  getInstrumentModuleCreationDefault,
  getInstrumentCreationViewportTier,
  instrumentCreationDefaultMatchesSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import {
  createInstrumentCreationRangeContext,
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { type ModuleCreationDefaults } from "@/types/instrument-creation-defaults";
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
    const moduleCreationDefaults = {
      moduleKindDefaults: {
        session: ["keyboard"],
      },
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
    } satisfies ModuleCreationDefaults;
    const selections = createDefaultInstrumentSelections(
      "tiny",
      moduleCreationDefaults,
    );

    expect(getDefaultInstrumentType(moduleCreationDefaults)).toBe("keyboard");
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

  it("uses context ranges before viewport ranges without saving them in setup defaults", () => {
    const selections = createDefaultInstrumentSelections(
      "tiny",
      {
        fretboard: {
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
      getInstrumentModuleCreationDefault(
        "fretboard",
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).not.toHaveProperty("range");
  });

  it("creates remembered setup defaults without range settings", () => {
    const selections = createDefaultInstrumentSelections("regular");
    const keyboardDefault = getInstrumentModuleCreationDefault(
      "keyboard",
      {
        ...selections.keyboardSelection,
        range: "custom",
        midiRange: [48, 96],
        theme: "inverted",
      },
      selections.fretboardSelection,
    );
    const fretboardDefault = getInstrumentModuleCreationDefault(
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
    expect(fretboardDefault).not.toHaveProperty("range");
    expect(fretboardDefault).toMatchObject({
      instrument: "guitar",
      tuningKey: "guitarStandardE",
      handedness: "left",
    });
  });

  it("creates remembered setup defaults with explicit range settings", () => {
    const selections = createDefaultInstrumentSelections("regular");
    const keyboardDefault = getInstrumentModuleCreationDefault(
      "keyboard",
      {
        ...selections.keyboardSelection,
        range: "custom",
        midiRange: [48, 96],
      },
      selections.fretboardSelection,
    );
    const fretboardDefault = getInstrumentModuleCreationDefault(
      "fretboard",
      selections.keyboardSelection,
      {
        ...selections.fretboardSelection,
        fretRange: [0, 24],
      },
    );

    expect(keyboardDefault).not.toHaveProperty("range");
    expect(fretboardDefault).not.toHaveProperty("range");
    expect(
      getInstrumentModuleCreationDefault(
        "keyboard",
        {
          ...selections.keyboardSelection,
          range: "custom",
          midiRange: [48, 96],
        },
        selections.fretboardSelection,
        { includeRange: true },
      ),
    ).toMatchObject({
      range: {
        source: "custom",
        midiRange: [48, 96],
      },
    });
    expect(
      getInstrumentModuleCreationDefault(
        "fretboard",
        selections.keyboardSelection,
        {
          ...selections.fretboardSelection,
          fretRange: [0, 24],
        },
        { includeRange: true },
      ),
    ).toMatchObject({
      range: {
        source: "custom",
        fretRange: [0, 24],
      },
    });
  });

  it("checks whether the current setup is already remembered", () => {
    const keyboardDefault = {
      keyboard: { theme: "studio" },
    } satisfies ModuleCreationDefaults;
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
        { keyboard: { theme: "classic" } },
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

  it("defaults to fretboard when no module creation memory is saved", () => {
    const selections = createDefaultInstrumentSelections("regular");

    expect(getDefaultInstrumentType(undefined)).toBe("fretboard");
    expect(
      instrumentCreationDefaultMatchesSelection(
        "fretboard",
        undefined,
        selections.keyboardSelection,
        selections.fretboardSelection,
      ),
    ).toBe(false);
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
