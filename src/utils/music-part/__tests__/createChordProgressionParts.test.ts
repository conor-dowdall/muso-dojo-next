import { describe, expect, it } from "vitest";
import {
  normalizeRootNoteString,
  resolvePracticalRootNote,
  rootNotes,
  chordProgressions,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";
import { getAutomaticRhythmBeats } from "@/utils/music-part/partLength";

describe("createChordProgressionParts", () => {
  it("uses practical Part roots while retaining theoretical progression spelling", () => {
    const jazzBluesParts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C♯",
      progressionKey: "jazzBlues",
      moduleRequests: [],
    });
    const sharpFour = jazzBluesParts.find(
      (part) => part.authoredProgression?.romanSymbol === "♯iv°7",
    );
    const flatOne = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "B♭",
      progression: {
        chords: [
          {
            degree: "♭1",
            chordCollectionKey: "major",
            durationInBars: 1,
          },
        ],
      },
      progressionName: "Flat Tonic",
      moduleRequests: [],
    })[0];

    expect(sharpFour).toMatchObject({
      rootNote: "G",
      authoredProgression: {
        rootNote: "F𝄪",
        romanSymbol: "♯iv°7",
      },
    });
    expect(flatOne).toMatchObject({
      rootNote: "A",
      authoredProgression: {
        rootNote: "B𝄫",
        romanSymbol: "♭I",
      },
    });
  });

  it("creates pitch-safe Parts for every built-in progression and tonal center", () => {
    const progressionKeys = Object.keys(
      chordProgressions,
    ) as ChordProgressionKey[];

    for (const rootNote of rootNotes) {
      for (const progressionKey of progressionKeys) {
        const parts = createChordProgressionParts({
          chordListMode: "full-song-order",
          rootNote,
          progressionKey,
          moduleRequests: [],
        });

        for (const part of parts) {
          const practicalRoot = normalizeRootNoteString(part.rootNote);
          const authored = part.authoredProgression;

          expect(practicalRoot).toBeDefined();
          expect(authored).toBeDefined();
          if (practicalRoot && authored) {
            expect(practicalRoot).toBe(
              resolvePracticalRootNote(authored.rootNote),
            );
          }
        }
      }
    }
  });

  it("creates fractional Parts with independent custom provenance", () => {
    const progression = {
      chords: [
        {
          degree: "1" as const,
          chordCollectionKey: "major" as const,
          durationInBars: 0.5,
        },
        {
          degree: "5" as const,
          chordCollectionKey: "dominant7" as const,
          durationInBars: 0.5,
        },
      ],
    } as const;
    const parts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "D",
      progression,
      progressionName: "Custom Turnaround",
      moduleRequests: [],
    });

    expect(parts).toHaveLength(2);
    expect(parts.map((part) => part.durationInBars)).toEqual([0.5, 0.5]);
    expect(parts.map((part) => part.rootNote)).toEqual(["D", "A"]);
    expect(parts[0]?.authoredProgression).toMatchObject({
      source: { kind: "custom", name: "Custom Turnaround" },
      romanSymbol: "I",
      tonalCenter: "D",
    });
    expect(parts[1]?.authoredProgression).toMatchObject({
      source: { kind: "custom", name: "Custom Turnaround" },
      romanSymbol: "V7",
    });
    expect(parts[0]?.authoredProgression?.progressionInstanceId).toBe(
      parts[1]?.authoredProgression?.progressionInstanceId,
    );
  });

  it("supports custom progressions as a unique-chord practice palette", () => {
    const progression = {
      chords: [
        {
          degree: "1" as const,
          chordCollectionKey: "major" as const,
          durationInBars: 0.5,
        },
        {
          degree: "5" as const,
          chordCollectionKey: "dominant7" as const,
          durationInBars: 0.5,
        },
        {
          degree: "1" as const,
          chordCollectionKey: "major" as const,
          durationInBars: 1,
        },
      ],
    } as const;
    const parts = createChordProgressionParts({
      chordListMode: "each-chord-once",
      rootNote: "E♭",
      progression,
      progressionName: "Custom Changes",
      moduleRequests: [],
    });

    expect(parts.map((part) => part.rootNote)).toEqual(["E♭", "B♭"]);
    expect(parts.every((part) => part.durationInBars === undefined)).toBe(true);
    expect(parts.every((part) => part.authoredProgression === undefined)).toBe(
      true,
    );
  });

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

  it("creates independent selected Rhythm sources in every progression Part", () => {
    const parts = createChordProgressionParts({
      rootNote: "C",
      progressionKey: "oneOneFiveFive",
      moduleRequests: [{ type: "rhythm" }],
    });
    const rhythmModules = parts.map((part) => part.modules[0]);
    const rhythmModuleIds = rhythmModules.map((module) => module?.id);

    expect(new Set(rhythmModuleIds).size).toBe(parts.length);
    parts.forEach((part, index) => {
      expect(part.band?.rhythm).toEqual({
        mode: "module",
        moduleId: rhythmModuleIds[index],
      });
    });
    expect(rhythmModules[0]).not.toBe(rhythmModules[1]);
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

    const progressionInstanceIds = parts.map(
      (part) => part.authoredProgression?.progressionInstanceId,
    );
    expect(new Set(progressionInstanceIds).size).toBe(1);
    expect(parts[0]?.authoredProgression).toMatchObject({
      kind: "chord-progression",
      noteCollectionKey: "major",
      source: {
        kind: "built-in",
        progressionKey: "oneFourOneFiveSplitReturn",
      },
      romanSymbol: "I",
      rootNote: "C",
      tonalCenter: "C",
    });
    expect(parts[7]?.authoredProgression).toMatchObject({
      romanSymbol: "V",
      rootNote: "G",
    });
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
    expect(parts.every((part) => part.authoredProgression === undefined)).toBe(
      true,
    );
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

  it("retains the authored full-bar Rhythm behind normalized split modules", () => {
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
                beats: 2,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "straight",
                  sound: "hat",
                  subdivision: "eighth-triplet",
                },
              },
              source: "recipe",
            },
          },
        },
      ],
    });

    for (const part of parts.slice(6, 8)) {
      expect(part?.modules[0]).toMatchObject({
        authoredBarRhythm: {
          recipe: {
            beats: 2,
            groove: "kit",
            timekeeper: { subdivision: "eighth-triplet" },
          },
        },
        rhythm: {
          recipe: {
            beats: 1,
            groove: "pulse",
          },
        },
        type: "rhythm",
      });
    }
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

    expect(aSectionParts).toHaveLength(15);
    expect(aSectionParts.slice(0, 4).map((part) => part.rootNote)).toEqual([
      "C",
      "A",
      "D",
      "G",
    ]);
    expect(
      aSectionParts.slice(0, -1).every((part) => part.durationInBars === 0.5),
    ).toBe(true);
    expect(aSectionParts.at(-1)?.durationInBars).toBeUndefined();
    expect(
      aSectionParts
        .slice(0, -1)
        .every((part) => getAutomaticRhythmBeats(part) === 2),
    ).toBe(true);
    expect(getAutomaticRhythmBeats(aSectionParts.at(-1)!)).toBe(4);
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
    const progression = {
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
    } as const;
    const parts = createChordProgressionParts({
      chordListMode: "full-song-order",
      rootNote: "C",
      progression,
      progressionName: "Third Bar Regression",
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
  });
});
