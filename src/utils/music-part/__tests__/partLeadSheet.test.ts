import { describe, expect, it } from "vitest";
import { getPartLeadSheetSummary } from "@/utils/music-part/partLeadSheet";
import { type MusicPartConfig } from "@/types/session";

function createPart(patch: Partial<MusicPartConfig> = {}): MusicPartConfig {
  return {
    id: "part",
    rootNote: "C",
    noteCollectionKey: "major",
    modules: [],
    ...patch,
  };
}

describe("getPartLeadSheetSummary", () => {
  it("shows a half-bar progression Part as 2/4 with a Half Bar note", () => {
    expect(
      getPartLeadSheetSummary(createPart({ durationInBars: 0.5 })),
    ).toMatchObject({
      durationLabel: "Half Bar",
      identityLabel: "CM",
      meterLabel: "2/4",
    });
  });

  it("drops the half-bar note when an explicit Rhythm changes the meter", () => {
    const summary = getPartLeadSheetSummary(
      createPart({
        durationInBars: 0.5,
        modules: [
          {
            id: "rhythm",
            rhythm: {
              recipe: {
                beats: 2,
                groove: "kit",
                grouping: "auto",
                timekeeper: {
                  feel: "triplet",
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
    );

    expect(summary).toMatchObject({
      meterLabel: "6/8",
    });
    expect(summary.durationLabel).toBeUndefined();
  });
});
