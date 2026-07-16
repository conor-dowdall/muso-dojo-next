import { describe, expect, it } from "vitest";
import { getPartLeadSheetSummary } from "@/utils/music-part/partLeadSheet";
import { type MusicPartConfig } from "@/types/session";
import { createDefaultSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";

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
  const authoredProgression = {
    kind: "chord-progression" as const,
    noteCollectionKey: "major" as const,
    progressionInstanceId: "progression-1",
    source: {
      kind: "built-in" as const,
      progressionKey: "oneFourOneFive" as const,
    },
    romanSymbol: "I" as const,
    rootNote: "C",
    tonalCenter: "C" as const,
  };

  it("shows authored Roman analysis while harmonic identity still matches", () => {
    const summary = getPartLeadSheetSummary(
      createPart({ authoredProgression, durationInBars: 0.5 }),
    );

    expect(summary.romanAnalysis).toBe("I");
    expect(summary.accessibleLabel).toContain("Roman numeral I");
  });

  it("hides stale Roman analysis after a harmonic edit", () => {
    const changedRoot = getPartLeadSheetSummary(
      createPart({ authoredProgression, rootNote: "D" }),
    );
    const changedCollection = getPartLeadSheetSummary(
      createPart({ authoredProgression, noteCollectionKey: "minor" }),
    );

    expect(changedRoot).not.toHaveProperty("romanAnalysis");
    expect(changedCollection).not.toHaveProperty("romanAnalysis");
  });

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

  it("keeps Chart metadata to the time signature for Session Swing", () => {
    const summary = getPartLeadSheetSummary(
      createPart({
        automaticRhythm: { style: "swing" },
        band: {
          backingNotes: { mode: "session" },
          rhythm: { mode: "session" },
        },
      }),
    );

    expect(summary.meterLabel).toBe("4/4");
    expect(summary).not.toHaveProperty("lengthLabel");
    expect(summary.meterDetail).toContain("Swing Session rhythm");
  });

  it("describes a disabled Session Rhythm as no band rhythm", () => {
    const backingBand = createDefaultSessionBackingBandConfig();
    const summary = getPartLeadSheetSummary(createPart(), {
      ...backingBand,
      rhythm: { ...backingBand.rhythm, mode: "off" },
    });

    expect(summary.meterDetail).toContain("No band rhythm");
    expect(summary.meterDetail).not.toContain("Session rhythm");
  });
});
