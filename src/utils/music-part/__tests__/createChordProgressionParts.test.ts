import { describe, expect, it } from "vitest";
import {
  chordProgressions,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";
import { getAutomaticRhythmBeats } from "@/utils/music-part/partLength";

describe("createChordProgressionParts", () => {
  it("copies the requested module set to every progression part", () => {
    const parts = createChordProgressionParts({
      rootNote: "C",
      progressionKey: "oneOneFiveFive",
      moduleRequests: [
        {
          type: "instrument",
          settings: {
            instrumentType: "fretboard",
          },
        },
        {
          type: "instrument",
          settings: {
            instrumentType: "keyboard",
          },
        },
        {
          type: "drone",
        },
      ],
    });

    expect(parts.length).toBeGreaterThan(0);

    parts.forEach((part) => {
      expect(part.modules).toHaveLength(3);
      expect(part.modules.map((module) => module.type)).toEqual([
        "instrument",
        "instrument",
        "drone",
      ]);
      expect(part.modules[0]).toMatchObject({
        instrument: {
          type: "fretboard",
        },
      });
      expect(part.modules[1]).toMatchObject({
        instrument: {
          type: "keyboard",
        },
      });
    });
  });

  it("expands full progressions into a duration-aware timeline", () => {
    const parts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C",
      progressionKey: "oneFourOneFiveSplitReturn",
      moduleRequests: [{ type: "rhythm" }],
    });

    expect(parts).toHaveLength(9);
    expect(parts.map((part) => part.rootNote)).toEqual([
      "C",
      "F",
      "C",
      "G",
      "C",
      "F",
      "C",
      "G",
      "C",
    ]);
    expect(parts[6]).toMatchObject({
      automaticRhythm: { style: "standard" },
      durationInBars: 0.5,
      rootNote: "C",
    });
    expect(parts[6]?.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 2,
        },
      },
      type: "rhythm",
    });
    expect(parts[7]).toMatchObject({
      durationInBars: 0.5,
      rootNote: "G",
    });
    expect(parts[7]?.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 2,
        },
      },
      type: "rhythm",
    });
    expect(parts[8]?.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 4,
        },
      },
      type: "rhythm",
    });
    expect(getAutomaticRhythmBeats(parts[8] ?? {})).toBe(4);
    expect(parts[8]).not.toHaveProperty("durationInBars");
  });

  it("keeps unique-chord mode as a one-part-per-chord practice palette", () => {
    const parts = createChordProgressionParts({
      chordListMode: "each-chord-once",
      rootNote: "C",
      progressionKey: "oneFourOneFiveSplitReturn",
      moduleRequests: [],
    });

    expect(parts.map((part) => part.rootNote)).toEqual(["C", "F", "G"]);
    expect(parts.every((part) => part.modules.length === 0)).toBe(true);
  });

  it("preserves custom Rhythm defaults when progression durations adjust beats", () => {
    const parts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C",
      progressionKey: "oneFourOneFiveSplitReturn",
      moduleRequests: [
        {
          type: "rhythm",
          settings: {
            rhythm: {
              recipe: {
                beats: 4,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "swing",
                  sound: "ride",
                  subdivision: "eighth",
                },
              },
              source: "recipe",
            },
          },
        },
      ],
    });

    expect(parts[6]?.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 2,
          groove: "kit",
          timekeeper: {
            feel: "swing",
            sound: "ride",
            subdivision: "eighth",
          },
        },
      },
      type: "rhythm",
    });
  });

  it("sizes split progression parts from the requested Rhythm bar length", () => {
    const parts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C",
      progressionKey: "oneFourOneFiveSplitReturn",
      moduleRequests: [
        {
          type: "rhythm",
          settings: {
            rhythm: {
              recipe: {
                beats: 6,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "straight",
                  sound: "hat",
                  subdivision: "eighth",
                },
              },
              source: "recipe",
            },
          },
        },
      ],
    });

    expect(parts[6]).toMatchObject({
      durationInBars: 0.5,
      modules: [
        {
          rhythm: {
            recipe: {
              beats: 3,
            },
          },
          type: "rhythm",
        },
      ],
    });
    expect(parts[8]?.modules[0]).toMatchObject({
      rhythm: {
        recipe: {
          beats: 6,
        },
      },
      type: "rhythm",
    });
  });

  it("builds Rhythm Changes sections as separate progression options", () => {
    const aSectionParts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C",
      progressionKey: "rhythmChangesA",
      moduleRequests: [],
    });
    const bridgeParts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C",
      progressionKey: "rhythmChangesBridge",
      moduleRequests: [],
    });

    expect(aSectionParts).toHaveLength(16);
    expect(aSectionParts.slice(0, 4).map((part) => part.rootNote)).toEqual([
      "C",
      "A",
      "D",
      "G",
    ]);
    expect(aSectionParts.every((part) => part.durationInBars === 0.5)).toBe(
      true,
    );
    expect(
      aSectionParts.every((part) => getAutomaticRhythmBeats(part) === 2),
    ).toBe(true);
    expect(
      aSectionParts.every((part) => part.automaticRhythm?.style === "swing"),
    ).toBe(true);

    expect(bridgeParts).toHaveLength(8);
    expect(bridgeParts.map((part) => part.rootNote)).toEqual([
      "E",
      "E",
      "A",
      "A",
      "D",
      "D",
      "G",
      "G",
    ]);
    expect(bridgeParts.every((part) => part.durationInBars === undefined)).toBe(
      true,
    );
    expect(
      bridgeParts.every((part) => getAutomaticRhythmBeats(part) === 4),
    ).toBe(true);
  });

  it("authors Swing for Jazz and Blues and Standard rhythm elsewhere", () => {
    const jazz = createChordProgressionParts({
      rootNote: "C",
      progressionKey: "majorTwoFiveOne",
      moduleRequests: [],
    });
    const blues = createChordProgressionParts({
      rootNote: "C",
      progressionKey: "twelveBarBlues",
      moduleRequests: [],
    });
    const common = createChordProgressionParts({
      rootNote: "C",
      progressionKey: "oneOneFiveFive",
      moduleRequests: [],
    });

    expect(jazz.every((part) => part.automaticRhythm?.style === "swing")).toBe(
      true,
    );
    expect(blues.every((part) => part.automaticRhythm?.style === "swing")).toBe(
      true,
    );
    expect(
      common.every((part) => part.automaticRhythm?.style === "standard"),
    ).toBe(true);
  });

  it("stores fractional chart durations even when default Rhythm beats cannot represent them", () => {
    const progressionKey = "thirdBarRegression" as ChordProgressionKey;
    const mutableProgressions = chordProgressions as Record<string, unknown>;
    const previousProgression = mutableProgressions[progressionKey];

    mutableProgressions[progressionKey] = {
      chords: [
        {
          chordCollectionKey: "major",
          degree: "1",
          durationInBars: 1 / 3,
        },
        {
          chordCollectionKey: "major",
          degree: "5",
          durationInBars: 2 / 3,
        },
      ],
    };

    try {
      const parts = createChordProgressionParts({
        chordListMode: "full-song-order",
        rootNote: "C",
        progressionKey,
        moduleRequests: [
          {
            type: "instrument",
            settings: {
              instrumentType: "fretboard",
            },
          },
        ],
      });

      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatchObject({
        rootNote: "C",
      });
      expect(parts[0]?.durationInBars).toBeCloseTo(1 / 3);
      expect(parts[1]).toMatchObject({
        rootNote: "G",
      });
      expect(parts[1]?.durationInBars).toBeCloseTo(2 / 3);
    } finally {
      if (previousProgression === undefined) {
        delete mutableProgressions[progressionKey];
      } else {
        mutableProgressions[progressionKey] = previousProgression;
      }
    }
  });
});
