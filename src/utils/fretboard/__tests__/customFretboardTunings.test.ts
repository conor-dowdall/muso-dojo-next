import { describe, expect, it } from "vitest";
import {
  conventionalToFretboardTuning,
  fretboardToConventionalTuning,
  normalizeCustomTuningNotes,
  normalizeSavedFretboardTunings,
  savedTuningNameIsAvailable,
} from "@/utils/fretboard/customFretboardTunings";

describe("customFretboardTunings", () => {
  it("converts between conventional and renderer string order", () => {
    const reentrantUkulele = [67, 60, 64, 69];

    expect(conventionalToFretboardTuning(reentrantUkulele)).toEqual([
      69, 64, 60, 67,
    ]);
    expect(
      fretboardToConventionalTuning(
        conventionalToFretboardTuning(reentrantUkulele),
      ),
    ).toEqual(reentrantUkulele);
  });

  it("normalizes MIDI notes and limits custom tunings to twelve strings", () => {
    expect(
      normalizeCustomTuningNotes([
        -3,
        60.6,
        200,
        ...Array.from({ length: 20 }, () => 64),
      ]),
    ).toEqual([0, 61, 127, ...Array.from({ length: 9 }, () => 64)]);
    expect(normalizeCustomTuningNotes([])).toBeUndefined();
  });

  it("normalizes persisted tunings and removes duplicate names per instrument", () => {
    expect(
      normalizeSavedFretboardTunings([
        {
          id: "open-d",
          instrument: "guitar",
          name: " Open D ",
          openMidiNotes: [38, 45, 50, 54, 57, 62],
        },
        {
          id: "duplicate-name",
          instrument: "guitar",
          name: "open d",
          openMidiNotes: [40, 45, 50, 55, 59, 64],
        },
        {
          id: "uke-open-d",
          instrument: "ukulele",
          name: "Open D",
          openMidiNotes: [69, 62, 66, 71],
        },
      ]),
    ).toEqual([
      {
        id: "open-d",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
      {
        id: "uke-open-d",
        instrument: "ukulele",
        name: "Open D",
        openMidiNotes: [69, 62, 66, 71],
      },
    ]);
  });

  it("checks names case-insensitively within one instrument", () => {
    const tunings = [
      {
        id: "open-d",
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
    ] as const;

    expect(savedTuningNameIsAvailable(tunings, "guitar", " open d ")).toBe(
      false,
    );
    expect(
      savedTuningNameIsAvailable(tunings, "guitar", "OPEN D", "open-d"),
    ).toBe(true);
    expect(savedTuningNameIsAvailable(tunings, "ukulele", "Open D")).toBe(true);
  });
});
