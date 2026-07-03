import { describe, expect, it } from "vitest";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";

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
});
