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
  it("shows a half-bar progression Part as a proportional 2/4 chart entry", () => {
    const summary = getPartLeadSheetSummary(
      createPart({ durationInBars: 0.5 }),
    );

    expect(summary).toMatchObject({
      chartSpanUnits: 210,
      identityLabel: "CM",
      isPartialBar: true,
      meterLabel: "2/4",
    });
    expect(summary).not.toHaveProperty("durationLabel");
  });

  it("uses a full chart span for ordinary Parts", () => {
    expect(getPartLeadSheetSummary(createPart())).toMatchObject({
      chartSpanUnits: 420,
      isPartialBar: false,
    });
  });

  it("uses an explicit Rhythm meter for a half-bar progression Part", () => {
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
                  feel: "straight",
                  sound: "hat",
                  subdivision: "eighth-triplet",
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
    expect(summary).not.toHaveProperty("durationLabel");
  });

  it("keeps Chart metadata to the time signature for Automatic Swing", () => {
    const summary = getPartLeadSheetSummary(
      createPart({
        automaticRhythm: { beats: 4, style: "swing" },
        band: {
          backingNotes: { mode: "automatic" },
          rhythm: { mode: "automatic" },
        },
      }),
    );

    expect(summary.meterLabel).toBe("4/4");
    expect(summary).not.toHaveProperty("lengthLabel");
    expect(summary.meterDetail).toContain("Swing automatic rhythm");
  });
});
