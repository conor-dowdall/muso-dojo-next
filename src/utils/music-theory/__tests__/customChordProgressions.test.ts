import {
  chordProgression,
  chordProgressions,
  noteLabelCollections,
} from "@musodojo/music-theory-data";
import { describe, expect, it } from "vitest";
import {
  createCustomProgressionBars,
  createCustomProgressionFromBars,
  customChordProgressionFlatDegrees,
  normalizeCustomChordProgression,
  normalizeSavedChordProgressions,
} from "@/utils/music-theory/customChordProgressions";

describe("customChordProgressions", () => {
  it("uses the package flat intervals and preserves optional sharp spellings", () => {
    expect(customChordProgressionFlatDegrees).toBe(
      noteLabelCollections.intervalsFlat.labels,
    );

    const progression = createCustomProgressionFromBars([
      {
        chords: [{ degree: "♯4", chordCollectionKey: "diminishedTriad" }],
      },
    ]);

    expect(progression?.chords[0]?.degree).toBe("♯4");
    expect(
      progression && chordProgression.getDirectRomanSymbols(progression),
    ).toEqual(["♯iv°"]);
  });

  it("converts visual bar slots into exact fractional chord events", () => {
    const progression = createCustomProgressionFromBars([
      { chords: [{ degree: "1", chordCollectionKey: "major" }] },
      {
        chords: [
          { degree: "4", chordCollectionKey: "major" },
          { degree: "5", chordCollectionKey: "dominant7" },
        ],
      },
      {
        chords: [
          { degree: "1", chordCollectionKey: "major" },
          { degree: "3", chordCollectionKey: "minor" },
          { degree: "6", chordCollectionKey: "minor" },
        ],
      },
      {
        chords: [
          { degree: "2", chordCollectionKey: "minor7" },
          { degree: "5", chordCollectionKey: "dominant7" },
          { degree: "1", chordCollectionKey: "major7" },
          { degree: "6", chordCollectionKey: "minor7" },
        ],
      },
    ]);

    expect(progression?.chords.map((chord) => chord.durationInBars)).toEqual([
      1,
      0.5,
      0.5,
      1 / 3,
      1 / 3,
      1 / 3,
      0.25,
      0.25,
      0.25,
      0.25,
    ]);
  });

  it("expands multi-bar built-in events into editable complete bars", () => {
    const bars = createCustomProgressionBars(chordProgressions.oneOneFiveFive);

    expect(bars).toEqual([
      { chords: [{ degree: "1", chordCollectionKey: "major" }] },
      { chords: [{ degree: "1", chordCollectionKey: "major" }] },
      { chords: [{ degree: "5", chordCollectionKey: "major" }] },
      { chords: [{ degree: "5", chordCollectionKey: "major" }] },
    ]);
  });

  it("rejects incomplete, uneven, or unsupported custom bars", () => {
    expect(
      normalizeCustomChordProgression({
        chords: [
          {
            degree: "1",
            chordCollectionKey: "major",
            durationInBars: 0.5,
          },
        ],
      }),
    ).toBeUndefined();
    expect(
      normalizeCustomChordProgression({
        chords: [
          {
            degree: "1",
            chordCollectionKey: "major",
            durationInBars: 0.75,
          },
          {
            degree: "5",
            chordCollectionKey: "major",
            durationInBars: 0.25,
          },
        ],
      }),
    ).toBeUndefined();
    expect(
      normalizeCustomChordProgression({
        chords: [
          {
            degree: "9",
            chordCollectionKey: "major",
            durationInBars: 1,
          },
        ],
      }),
    ).toBeUndefined();
  });

  it("enforces the visual composer's bar and chord limits", () => {
    const tonic = {
      degree: "1" as const,
      chordCollectionKey: "major" as const,
    };

    expect(
      createCustomProgressionFromBars(
        Array.from({ length: 33 }, () => ({ chords: [tonic] })),
      ),
    ).toBeUndefined();
    expect(
      createCustomProgressionFromBars([
        { chords: Array.from({ length: 5 }, () => tonic) },
      ]),
    ).toBeUndefined();
  });

  it("normalizes unique saved progression names and strips analysis metadata", () => {
    const progression = {
      chords: [
        {
          degree: "5",
          chordCollectionKey: "dominant7",
          durationInBars: 1,
          analysis: { romanSymbol: "V7/ii" },
        },
      ],
    };

    expect(
      normalizeSavedChordProgressions([
        { id: "one", name: "My Changes", progression },
        { id: "two", name: " my changes ", progression },
      ]),
    ).toEqual([
      {
        id: "one",
        name: "My Changes",
        progression: {
          chords: [
            {
              degree: "5",
              chordCollectionKey: "dominant7",
              durationInBars: 1,
            },
          ],
        },
      },
    ]);
  });
});
