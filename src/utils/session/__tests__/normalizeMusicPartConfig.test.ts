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
});
