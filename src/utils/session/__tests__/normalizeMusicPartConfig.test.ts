import { describe, expect, it } from "vitest";
import { normalizeMusicPartConfig } from "@/utils/session/normalizeMusicPartConfig";

describe("normalizeMusicPartConfig", () => {
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

  it("migrates explicit Part Lengths into Automatic Rhythm beats", () => {
    expect(
      normalizeMusicPartConfig({
        id: "one-beat",
        rootNote: "C",
        noteCollectionKey: "major",
        lengthBeats: 1,
        modules: [],
      }),
    ).toMatchObject({
      automaticRhythm: { beats: 1, style: "standard" },
    });
    expect(
      normalizeMusicPartConfig({
        id: "two-beats",
        rootNote: "C",
        noteCollectionKey: "major",
        lengthBeats: 2,
        modules: [],
      }),
    ).toMatchObject({
      automaticRhythm: { beats: 2, style: "standard" },
    });
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
      automaticRhythm: { beats: 2, style: "standard" },
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
      automaticRhythm: { beats: 4, style: "standard" },
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
      automaticRhythm: { beats: 4, style: "swing" },
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
      automaticRhythm: { beats: 4, style: "standard" },
    });
  });
});
