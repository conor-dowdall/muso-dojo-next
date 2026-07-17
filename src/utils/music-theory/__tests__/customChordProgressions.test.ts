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
  getCustomProgressionCompatibleBeatCounts,
  normalizeCustomChordProgression,
  normalizeSavedChordProgressions,
  removeCustomProgressionDraftChord,
  selectCustomProgressionBarBeat,
} from "@/utils/music-theory/customChordProgressions";

describe("customChordProgressions", () => {
  it("uses the package flat intervals and preserves optional sharp spellings", () => {
    expect(customChordProgressionFlatDegrees).toBe(
      noteLabelCollections.intervalsFlat.labels,
    );

    const progression = createCustomProgressionFromBars([
      {
        chords: [
          {
            degree: "♯4",
            chordCollectionKey: "diminishedTriad",
            durationInBars: 1,
          },
        ],
      },
    ]);

    expect(progression?.chords[0]?.degree).toBe("♯4");
    expect(
      progression && chordProgression.getDirectRomanSymbols(progression),
    ).toEqual(["♯iv°"]);
  });

  it("converts visual bar slots into exact fractional chord events", () => {
    const progression = createCustomProgressionFromBars([
      {
        chords: [
          { degree: "1", chordCollectionKey: "major", durationInBars: 1 },
        ],
      },
      {
        chords: [
          { degree: "4", chordCollectionKey: "major", durationInBars: 0.5 },
          {
            degree: "5",
            chordCollectionKey: "dominant7",
            durationInBars: 0.5,
          },
        ],
      },
      {
        chords: [
          {
            degree: "1",
            chordCollectionKey: "major",
            durationInBars: 1 / 3,
          },
          {
            degree: "3",
            chordCollectionKey: "minor",
            durationInBars: 1 / 3,
          },
          {
            degree: "6",
            chordCollectionKey: "minor",
            durationInBars: 1 / 3,
          },
        ],
      },
      {
        chords: [
          {
            degree: "2",
            chordCollectionKey: "minor7",
            durationInBars: 0.25,
          },
          {
            degree: "5",
            chordCollectionKey: "dominant7",
            durationInBars: 0.25,
          },
          {
            degree: "1",
            chordCollectionKey: "major7",
            durationInBars: 0.25,
          },
          {
            degree: "6",
            chordCollectionKey: "minor7",
            durationInBars: 0.25,
          },
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
      {
        chords: [
          { degree: "1", chordCollectionKey: "major", durationInBars: 1 },
        ],
      },
      {
        chords: [
          { degree: "1", chordCollectionKey: "major", durationInBars: 1 },
        ],
      },
      {
        chords: [
          { degree: "5", chordCollectionKey: "major", durationInBars: 1 },
        ],
      },
      {
        chords: [
          { degree: "5", chordCollectionKey: "major", durationInBars: 1 },
        ],
      },
    ]);
  });

  it("accepts uneven beat-aligned bars and rejects incomplete or unsupported bars", () => {
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
    ).toBeDefined();
    expect(
      normalizeCustomChordProgression({
        chords: [
          {
            degree: "1",
            chordCollectionKey: "major",
            durationInBars: 1 / 9,
          },
          {
            degree: "5",
            chordCollectionKey: "major",
            durationInBars: 8 / 9,
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
    expect(
      normalizeCustomChordProgression({
        chords: [
          {
            degree: "1",
            chordCollectionKey: "major9",
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
      durationInBars: 1,
    };

    expect(
      createCustomProgressionFromBars(
        Array.from({ length: 33 }, () => ({ chords: [tonic] })),
      ),
    ).toBeUndefined();
    expect(
      createCustomProgressionFromBars([
        { chords: Array.from({ length: 9 }, () => tonic) },
      ]),
    ).toBeUndefined();
  });

  it("creates chord changes on counted beats and preserves the complete bar", () => {
    const wholeBar = {
      chords: [
        {
          degree: "1" as const,
          chordCollectionKey: "major" as const,
          durationInBars: 1,
        },
      ],
    };
    const beatThree = selectCustomProgressionBarBeat(wholeBar, 4, 2);

    expect(beatThree).toEqual({
      bar: {
        chords: [
          { degree: "1", chordCollectionKey: "major", durationInBars: 0.5 },
          { degree: "1", chordCollectionKey: "major", durationInBars: 0.5 },
        ],
      },
      chordIndex: 1,
      inserted: true,
    });

    const beatFour =
      beatThree && selectCustomProgressionBarBeat(beatThree.bar, 4, 3);
    expect(beatFour?.bar.chords.map((chord) => chord.durationInBars)).toEqual([
      0.5, 0.25, 0.25,
    ]);

    const removed =
      beatFour && removeCustomProgressionDraftChord(beatFour.bar, 1);
    expect(removed?.chords.map((chord) => chord.durationInBars)).toEqual([
      0.75, 0.25,
    ]);
  });

  it("offers only beat grids that preserve every chord boundary", () => {
    const bars = [
      {
        chords: [
          {
            degree: "1" as const,
            chordCollectionKey: "major" as const,
            durationInBars: 0.5,
          },
          {
            degree: "5" as const,
            chordCollectionKey: "major" as const,
            durationInBars: 0.5,
          },
        ],
      },
    ];

    expect(getCustomProgressionCompatibleBeatCounts(bars)).toEqual([
      2, 4, 6, 8,
    ]);
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
