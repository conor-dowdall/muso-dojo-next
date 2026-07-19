import { describe, expect, it } from "vitest";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";

describe("normalizeMusicPartConfig", () => {
  it("normalizes complete authored progression analysis", () => {
    expect(
      normalizeMusicPartConfig({
        authoredProgression: {
          kind: "chord-progression",
          noteCollectionKey: "dominant7",
          progressionInstanceId: " progression-1 ",
          progressionKey: "authenticCadence",
          romanSymbol: " V7 ",
          rootNote: "G",
          tonalCenter: "C",
        },
        id: "part-1",
        modules: [],
        noteCollectionKey: "dominant7",
        rootNote: "G",
      }),
    ).toMatchObject({
      authoredProgression: {
        kind: "chord-progression",
        noteCollectionKey: "dominant7",
        progressionInstanceId: "progression-1",
        source: {
          kind: "built-in",
          progressionKey: "authenticCadence",
        },
        romanSymbol: "V7",
        rootNote: "G",
        tonalCenter: "C",
      },
    });
  });

  it("drops incomplete or invalid authored progression analysis", () => {
    expect(
      normalizeMusicPartConfig({
        authoredProgression: {
          kind: "chord-progression",
          progressionInstanceId: "progression-1",
          progressionKey: "not-a-progression",
          romanSymbol: "I",
          rootNote: "C",
          tonalCenter: "C",
        },
        id: "part-1",
        modules: [],
        noteCollectionKey: "major",
        rootNote: "C",
      }),
    ).not.toHaveProperty("authoredProgression");
  });

  it("normalizes custom progression provenance without a library link", () => {
    expect(
      normalizeMusicPartConfig({
        authoredProgression: {
          kind: "chord-progression",
          noteCollectionKey: "minor7",
          progressionInstanceId: "custom-instance",
          source: { kind: "custom", name: " My Changes " },
          romanSymbol: "iim7",
          rootNote: "D",
          tonalCenter: "C",
        },
        id: "part-1",
        modules: [],
        noteCollectionKey: "minor7",
        rootNote: "D",
      }),
    ).toMatchObject({
      authoredProgression: {
        source: { kind: "custom", name: "My Changes" },
        romanSymbol: "iim7",
      },
    });
  });

  it("preserves a theoretically spelled progression root", () => {
    expect(
      normalizeMusicPartConfig({
        authoredProgression: {
          kind: "chord-progression",
          noteCollectionKey: "diminished7",
          progressionInstanceId: "jazz-blues",
          source: { kind: "built-in", progressionKey: "jazzBlues" },
          romanSymbol: "♯iv°7",
          rootNote: "F##",
          tonalCenter: "C#",
        },
        id: "sharp-four",
        modules: [],
        noteCollectionKey: "diminished7",
        rootNote: "G",
      }),
    ).toMatchObject({
      authoredProgression: {
        romanSymbol: "♯iv°7",
        rootNote: "F𝄪",
        tonalCenter: "C♯",
      },
      rootNote: "G",
    });
  });

  it("ignores old persisted layout values", () => {
    const part = normalizeMusicPartConfig({
      id: "part-1",
      rootNote: "C",
      noteCollectionKey: "major",
      layout: "row",
      modules: [],
    });

    expect(part).not.toHaveProperty("layout");
  });

  it("keeps only representable non-default Part durations", () => {
    expect(
      normalizeMusicPartConfig({
        id: "half-bar",
        rootNote: "C",
        noteCollectionKey: "major",
        durationInBars: 0.5,
        modules: [],
      }),
    ).toMatchObject({
      durationInBars: 0.5,
    });

    expect(
      normalizeMusicPartConfig({
        id: "awkward-fraction",
        rootNote: "C",
        noteCollectionKey: "major",
        durationInBars: 0.33,
        modules: [],
      }),
    ).not.toHaveProperty("durationInBars");
  });

  it("keeps exact simple fractional Part durations", () => {
    expect(
      normalizeMusicPartConfig({
        id: "third-bar",
        rootNote: "C",
        noteCollectionKey: "major",
        durationInBars: 1 / 3,
        modules: [],
      }),
    ).toMatchObject({
      durationInBars: 0.333333,
    });
  });

  it("drops obsolete explicit Part Length settings", () => {
    expect(
      normalizeMusicPartConfig({
        id: "one-beat",
        rootNote: "C",
        noteCollectionKey: "major",
        lengthBeats: 1,
        modules: [],
      }),
    ).not.toHaveProperty("lengthBeats");
  });

  it("migrates authored duration while keeping ordinary Parts at four beats", () => {
    expect(
      normalizeMusicPartConfig({
        id: "half-bar",
        rootNote: "C",
        noteCollectionKey: "major",
        durationInBars: 0.5,
        modules: [],
      }),
    ).toMatchObject({
      automaticRhythm: { style: "standard" },
    });
    expect(
      normalizeMusicPartConfig({
        id: "six-beat",
        rootNote: "C",
        noteCollectionKey: "major",
        modules: [
          {
            id: "rhythm",
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
            type: "rhythm",
          },
        ],
      }),
    ).toMatchObject({
      band: { rhythm: { mode: "module", moduleId: "rhythm" } },
      automaticRhythm: { style: "standard" },
    });
  });

  it("normalizes automatic rhythm style independently of modules", () => {
    expect(
      normalizeMusicPartConfig({
        id: "swing",
        rootNote: "C",
        noteCollectionKey: "major",
        automaticRhythm: "swing",
        modules: [],
      }),
    ).toMatchObject({
      automaticRhythm: { style: "swing" },
    });
    expect(
      normalizeMusicPartConfig({
        id: "invalid",
        rootNote: "C",
        noteCollectionKey: "major",
        automaticRhythm: "shuffle",
        modules: [],
      }),
    ).toMatchObject({
      automaticRhythm: { style: "standard" },
    });
  });
});
