import { describe, expect, it } from "vitest";
import { getPartLengthBeats } from "@/utils/music-part/partLength";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";

describe("Part Length", () => {
  it("defaults to four fixed beats", () => {
    expect(getPartLengthBeats({})).toBe(4);
  });

  it("follows only the explicitly selected band Rhythm", () => {
    const modules = [
      {
        id: "four",
        rhythm: DEFAULT_RHYTHM_SELECTION,
        type: "rhythm" as const,
      },
      {
        id: "six",
        rhythm: {
          recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 6 },
          source: "recipe" as const,
        },
        type: "rhythm" as const,
      },
    ];

    expect(
      getPartLengthBeats({
        band: {
          backingNotes: { mode: "session" },
          rhythm: { mode: "module", moduleId: "six" },
        },
        modules,
      }),
    ).toBe(6);
  });

  it("uses four beats for Automatic Rhythm when no authored duration exists", () => {
    expect(
      getPartLengthBeats({
        band: {
          backingNotes: { mode: "session" },
          rhythm: { mode: "session" },
        },
        modules: [],
      }),
    ).toBe(4);
  });

  it("preserves an authored fractional duration for Automatic Rhythm", () => {
    expect(getPartLengthBeats({ durationInBars: 0.5 })).toBe(2);
  });
});
