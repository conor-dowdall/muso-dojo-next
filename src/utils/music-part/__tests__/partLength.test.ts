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
          backingNotes: { mode: "automatic" },
          rhythm: { mode: "module", moduleId: "six" },
        },
        automaticRhythm: { beats: 2, style: "standard" },
        modules,
      }),
    ).toBe(6);
  });

  it("falls back to Automatic Rhythm beats when no module is selected", () => {
    expect(
      getPartLengthBeats({
        band: {
          backingNotes: { mode: "automatic" },
          rhythm: { mode: "automatic" },
        },
        automaticRhythm: { beats: 2, style: "standard" },
        modules: [],
      }),
    ).toBe(2);
  });
});
