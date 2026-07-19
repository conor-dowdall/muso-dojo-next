import { describe, expect, it } from "vitest";
import { type MusicPartConfig } from "@/types/session";
import { createDefaultSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import { DEFAULT_RHYTHM_SELECTION } from "@/utils/rhythm/rhythmConfig";
import { createSessionBarPlan } from "../sessionBarPlan";

function createPart(
  id: string,
  patch: Partial<Omit<MusicPartConfig, "id">> = {},
): MusicPartConfig {
  return {
    id,
    modules: [],
    noteCollectionKey: "major",
    rootNote: "C",
    ...patch,
  };
}

function createLocalRhythmPart(id: string, beats: number) {
  const moduleId = `rhythm-${id}`;

  return createPart(id, {
    band: {
      backingNotes: { mode: "session" },
      rhythm: { mode: "module", moduleId },
    },
    durationInBars: 0.5,
    modules: [
      {
        id: moduleId,
        rhythm: {
          recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats },
          source: "recipe",
        },
        type: "rhythm",
      },
    ],
  });
}

describe("createSessionBarPlan", () => {
  it("exposes a continuous automatic rhythm for an ordinary authored bar", () => {
    const plan = createSessionBarPlan([
      createPart("bar", { automaticRhythm: { style: "swing" } }),
    ]);

    expect(plan.entries[0]?.continuousRhythmSelection).toMatchObject({
      recipe: { beats: 4, timekeeper: { feel: "swing" } },
    });
  });

  it("groups fractional Parts under one authored meter", () => {
    const plan = createSessionBarPlan([
      createPart("a", {
        automaticRhythm: { style: "swing" },
        durationInBars: 0.5,
      }),
      createPart("b", {
        automaticRhythm: { style: "swing" },
        durationInBars: 0.5,
      }),
    ]);

    expect(plan).toMatchObject({
      layout: "authored",
      totalAccessibleLabel: "1",
    });
    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]).toMatchObject({
      accessibleLabel: "1",
      label: "01",
      meterLabel: "4/4",
      segments: [
        { part: { id: "a" }, segmentLabel: "a" },
        { part: { id: "b" }, segmentLabel: "b" },
      ],
    });
    expect(plan.entries[0]?.continuousRhythmSelection).toMatchObject({
      recipe: { beats: 4 },
    });
  });

  it("joins two matching three-beat local Rhythms into repeated 3/4", () => {
    const plan = createSessionBarPlan([
      createLocalRhythmPart("a", 3),
      createLocalRhythmPart("b", 3),
    ]);

    expect(plan.layout).toBe("authored");
    expect(plan.entries[0]).toMatchObject({
      continuousRhythmScope: "bar",
      continuousRhythmSelection: { recipe: { beats: 6 } },
      meterLabel: "3/4 × 2",
    });
  });

  it("shows a compound parent meter without inventing continuous audio", () => {
    const createCompoundPart = (id: string) => {
      const part = createLocalRhythmPart(id, 1);
      const rhythmModule = part.modules[0];
      if (rhythmModule?.type === "rhythm") {
        rhythmModule.rhythm = {
          recipe: {
            ...rhythmModule.rhythm.recipe,
            groove: "pulse",
            timekeeper: {
              feel: "straight",
              sound: "hat",
              subdivision: "3-per-beat",
            },
          },
          source: "recipe",
        };
      }
      return part;
    };
    const plan = createSessionBarPlan([
      createCompoundPart("a"),
      createCompoundPart("b"),
    ]);

    expect(plan.layout).toBe("authored");
    expect(plan.entries[0]?.meterLabel).toBe("6/8");
    expect(plan.entries[0]).not.toHaveProperty("continuousRhythmSelection");
  });

  it("restores an authored full-bar groove lost while normalizing its segments", () => {
    const authoredBarRhythm = {
      recipe: {
        ...DEFAULT_RHYTHM_SELECTION.recipe,
        beats: 2,
        groove: "kit" as const,
        timekeeper: {
          feel: "straight" as const,
          sound: "hat" as const,
          subdivision: "3-per-beat" as const,
        },
      },
      source: "recipe" as const,
    };
    const parts = [
      createLocalRhythmPart("a", 1),
      createLocalRhythmPart("b", 1),
    ];

    parts.forEach((part) => {
      const rhythmModule = part.modules[0];
      if (rhythmModule?.type === "rhythm") {
        rhythmModule.authoredBarRhythm = authoredBarRhythm;
        rhythmModule.rhythm = {
          recipe: {
            ...authoredBarRhythm.recipe,
            beats: 1,
            groove: "pulse",
          },
          source: "recipe",
        };
      }
    });

    const plan = createSessionBarPlan(parts);

    expect(plan.entries[0]).toMatchObject({
      continuousRhythmScope: "bar",
      continuousRhythmSelection: {
        recipe: {
          beats: 2,
          groove: "kit",
          timekeeper: { subdivision: "3-per-beat" },
        },
      },
      meterLabel: "6/8",
    });
  });

  it("stops using authored bar provenance after a segment Rhythm is edited", () => {
    const parts = [
      createLocalRhythmPart("a", 1),
      createLocalRhythmPart("b", 1),
    ];
    const authoredBarRhythm = {
      recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 2 },
      source: "recipe" as const,
    };

    parts.forEach((part) => {
      const rhythmModule = part.modules[0];
      if (rhythmModule?.type === "rhythm") {
        rhythmModule.authoredBarRhythm = authoredBarRhythm;
        rhythmModule.rhythm = {
          recipe: {
            ...authoredBarRhythm.recipe,
            beats: 1,
            groove: "pulse",
          },
          source: "recipe",
        };
      }
    });

    const editedModule = parts[1]?.modules[0];
    if (editedModule?.type === "rhythm") {
      editedModule.rhythm = {
        recipe: {
          ...editedModule.rhythm.recipe,
          timekeeper: {
            ...editedModule.rhythm.recipe.timekeeper,
            sound: "ride",
          },
        },
        source: "recipe",
      };
    }

    expect(createSessionBarPlan(parts).entries[0]).not.toHaveProperty(
      "continuousRhythmSelection",
    );
  });

  it("does not restore a complete parent Rhythm for an incomplete authored bar", () => {
    const authoredBarRhythm = {
      recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 4 },
      source: "recipe" as const,
    };
    const parts = ["a", "b", "c"].map((id) => {
      const part = createLocalRhythmPart(id, 1);
      part.durationInBars = 0.25;
      const rhythmModule = part.modules[0];
      if (rhythmModule?.type === "rhythm") {
        rhythmModule.authoredBarRhythm = authoredBarRhythm;
        rhythmModule.rhythm = {
          recipe: {
            ...authoredBarRhythm.recipe,
            beats: 1,
            groove: "pulse",
          },
          source: "recipe",
        };
      }
      return part;
    });

    const plan = createSessionBarPlan(parts);

    expect(plan.layout).toBe("authored");
    expect(plan.totalAccessibleLabel).toBe("3/4");
    expect(plan.entries[0]).not.toHaveProperty("continuousRhythmSelection");
  });

  it("falls back to linear Parts when a fractional Part crosses a bar boundary", () => {
    const plan = createSessionBarPlan([
      createPart("a", { durationInBars: 0.75 }),
      createPart("b", { durationInBars: 0.75 }),
    ]);

    expect(plan.layout).toBe("linear");
    expect(plan.entries.map((entry) => entry.label)).toEqual(["01", "02"]);
  });

  it("falls back to full-width Parts when local Beats break a split", () => {
    const plan = createSessionBarPlan([
      createLocalRhythmPart("a", 3),
      createLocalRhythmPart("b", 4),
    ]);

    expect(plan.layout).toBe("linear");
    expect(plan.entries).toHaveLength(2);
    expect(plan.entries.map((entry) => entry.label)).toEqual(["01", "02"]);
    expect(
      plan.entries.flatMap((entry) =>
        entry.segments.map((segment) => segment.chartSpanUnits),
      ),
    ).toEqual([420, 420]);
  });

  it("treats a Custom Session Rhythm as absolute for every Part", () => {
    const backingBand = createDefaultSessionBackingBandConfig();
    const plan = createSessionBarPlan(
      [
        createPart("a", { durationInBars: 0.5 }),
        createPart("b", { durationInBars: 0.5 }),
      ],
      {
        ...backingBand,
        rhythm: {
          mode: "custom",
          selection: {
            recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 5 },
            source: "recipe",
          },
        },
      },
    );

    expect(plan.layout).toBe("linear");
    expect(plan.entries.map((entry) => entry.meterLabel)).toEqual([
      "5/4",
      "5/4",
    ]);
  });

  it("preserves split bars when a Custom Session Rhythm divides cleanly", () => {
    const backingBand = createDefaultSessionBackingBandConfig();
    const plan = createSessionBarPlan(
      [
        createPart("a", { durationInBars: 0.5 }),
        createPart("b", { durationInBars: 0.5 }),
      ],
      {
        ...backingBand,
        rhythm: {
          mode: "custom",
          selection: {
            recipe: { ...DEFAULT_RHYTHM_SELECTION.recipe, beats: 6 },
            source: "recipe",
          },
        },
      },
    );

    expect(plan.layout).toBe("authored");
    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]).toMatchObject({
      continuousRhythmScope: "session",
      continuousRhythmSelection: { recipe: { beats: 6 } },
      meterLabel: "3/4 × 2",
      segments: [
        { part: { id: "a" }, resolvedBand: { durationBeats: 3 } },
        { part: { id: "b" }, resolvedBand: { durationBeats: 3 } },
      ],
    });
  });
});
