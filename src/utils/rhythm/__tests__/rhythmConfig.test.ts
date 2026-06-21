import { describe, expect, it } from "vitest";
import {
  DEFAULT_RHYTHM_RECIPE,
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionLabel,
  getRhythmSelectionPattern,
  normalizeRhythmPattern,
  normalizeRhythmRecipe,
  normalizeRhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import {
  getRhythmGroupingChoiceLabel,
  getRhythmGroupingOptions,
  getRhythmGroupingReadout,
  getRhythmTheoryReadout,
  RHYTHM_PPQ,
} from "@/data/rhythmPresets";

describe("rhythmConfig", () => {
  it("normalizes recipe rhythm selections without mixer data", () => {
    expect(
      normalizeRhythmSelection({
        recipe: {
          beats: 7,
          groove: "backbeat",
          grouping: "3+4",
          timekeeper: {
            feel: "swing",
            sound: "ride",
            subdivision: "eighth",
            volume: 0.8,
          },
          volume: 0.2,
        },
        source: "recipe",
      }),
    ).toStrictEqual({
      recipe: {
        beats: 7,
        groove: "backbeat",
        grouping: "3+4",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });
  });

  it("normalizes individual recipe fields back to sensible defaults", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 99,
        timekeeper: {
          feel: "crooked",
          sound: "triangle",
          subdivision: "whole",
        },
      }),
    ).toStrictEqual(DEFAULT_RHYTHM_RECIPE);
  });

  it("normalizes timekeeper modifiers to canonical subdivisions", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 5,
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "quarter",
        },
      }),
    ).toStrictEqual({
      beats: 5,
      groove: "backbeat",
      grouping: "auto",
      timekeeper: {
        feel: "triplet",
        sound: "hat",
        subdivision: "eighth",
      },
    });
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        timekeeper: {
          feel: "shuffle",
          sound: "ride",
          subdivision: "sixteenth",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "backbeat",
      grouping: "auto",
      timekeeper: {
        feel: "shuffle",
        sound: "ride",
        subdivision: "eighth",
      },
    });
  });

  it("normalizes legacy off sound into the timekeeper rhythm", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        timekeeper: {
          feel: "straight",
          sound: "off",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "backbeat",
      grouping: "auto",
      timekeeper: {
        feel: "off",
        sound: "hat",
        subdivision: "eighth",
      },
    });
  });

  it("normalizes grouping against the beat count", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        groove: "backbeat",
        grouping: "2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "backbeat",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "hat",
        subdivision: "eighth",
      },
    });
  });

  it("normalizes fixed foundation grooves to the default variation", () => {
    const pulseSelection = normalizeRhythmSelection({
      recipe: {
        beats: 5,
        groove: "pulse",
        grouping: "2+3",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(getRhythmSelectionLabel(pulseSelection)).toBe(
      "5/4 - Pulse - No Timekeeper",
    );
    expect(
      normalizeRhythmRecipe({
        beats: 5,
        groove: "pulse",
        grouping: "2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toMatchObject({
      beats: 5,
      groove: "pulse",
      grouping: "auto",
    });
    expect(
      normalizeRhythmRecipe({
        beats: 7,
        groove: "bluegrass",
        grouping: "3+4",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toMatchObject({
      beats: 7,
      groove: "bluegrass",
      grouping: "auto",
    });
  });

  it("normalizes moved offbeat timekeepers away from drive grooves", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        groove: "bluegrass",
        grouping: "auto",
        timekeeper: {
          feel: "shuffle",
          sound: "ride",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "bluegrass",
      grouping: "auto",
      timekeeper: {
        feel: "off",
        sound: "ride",
        subdivision: "eighth",
      },
    });
  });

  it("falls back to the default rhythm for unknown selections", () => {
    expect(
      normalizeRhythmSelection({
        source: "unknown",
      }),
    ).toStrictEqual(DEFAULT_RHYTHM_SELECTION);
    expect(normalizeRhythmSelection(undefined)).toStrictEqual(
      DEFAULT_RHYTHM_SELECTION,
    );
  });

  it("generates concrete hits from a rhythm recipe", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 4,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "4/4 - Backbeat - Ride Swing Timekeeper",
    );
    expect(pattern).toMatchObject({
      cycleTicks: RHYTHM_PPQ * 4,
      meter: { beats: 4, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
    });
    expect(pattern.swing).toBeUndefined();
    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        { atTicks: 0, sampleId: "kick", velocity: 0.9 },
        { atTicks: 0, sampleId: "ride", velocity: 0.234 },
        {
          atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
          sampleId: "ride",
          velocity: 0.108,
        },
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
        { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.62 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "snare", velocity: 0.72 },
      ]),
    );
    expect(pattern.hits).not.toEqual(
      expect.arrayContaining([
        {
          atTicks: Math.round((RHYTHM_PPQ * 2) / 3),
          sampleId: "ride",
          velocity: 0.108,
        },
      ]),
    );
  });

  it("keeps shuffle as a denser swung offbeat pattern", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 4,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "shuffle",
          sound: "ride",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "4/4 - Backbeat - Ride Shuffle Timekeeper",
    );
    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        {
          atTicks: Math.round((RHYTHM_PPQ * 2) / 3),
          sampleId: "ride",
          velocity: 0.108,
        },
        {
          atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
          sampleId: "ride",
          velocity: 0.108,
        },
      ]),
    );
  });

  it("leaves the timekeeper lane silent when it is off", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits.some((hit) => hit.sampleId === "closed-hat")).toBe(
      false,
    );
    expect(pattern.hits.some((hit) => hit.sampleId === "kick")).toBe(true);
    expect(pattern.hits.some((hit) => hit.sampleId === "snare")).toBe(true);
  });

  it("can generate a bass-drum-only practice beat", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "pulse",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.58 },
    ]);
  });

  it("generates a bluegrass-style offbeat snare drive", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "bluegrass",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.88 },
      { atTicks: RHYTHM_PPQ / 2, sampleId: "snare", velocity: 0.52 },
      { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.58 },
      {
        atTicks: RHYTHM_PPQ + RHYTHM_PPQ / 2,
        sampleId: "snare",
        velocity: 0.52,
      },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.58 },
      {
        atTicks: RHYTHM_PPQ * 2 + RHYTHM_PPQ / 2,
        sampleId: "snare",
        velocity: 0.52,
      },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.58 },
      {
        atTicks: RHYTHM_PPQ * 3 + RHYTHM_PPQ / 2,
        sampleId: "snare",
        velocity: 0.52,
      },
    ]);
  });

  it("generates triplet timekeeper hits without moving the groove lane", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        { atTicks: 0, sampleId: "kick", velocity: 0.9 },
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
        { atTicks: RHYTHM_PPQ / 3, sampleId: "closed-hat", velocity: 0.175 },
      ]),
    );
  });

  it("resolves recognized rhythm settings into music-theory readouts", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 2,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(getRhythmSelectionLabel(selection)).toBe(
      "6/8 - Backbeat - Hi-Hat 3 per Beat Timekeeper",
    );
    expect(getRhythmTheoryReadout(selection.recipe)).toStrictEqual({
      title: "6/8",
      detail: "Compound Duple Meter • 2 Groups of 3",
    });
  });

  it("uses theory-only labels for straight and compound readouts", () => {
    expect(
      getRhythmTheoryReadout({
        beats: 2,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "2/4",
      detail: "Simple Duple Meter • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 3,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "3/4",
      detail: "Simple Triple Meter • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple Meter • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 3,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "9/8",
      detail: "Compound Triple Meter • 3 Groups of 3",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "triplet",
          sound: "ride",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "12/8",
      detail: "Compound Quadruple Meter • 4 Groups of 3",
    });
    expect(
      getRhythmSelectionLabel(
        normalizeRhythmSelection({
          recipe: {
            beats: 4,
            groove: "backbeat",
            grouping: "auto",
            timekeeper: {
              feel: "triplet",
              sound: "ride",
              subdivision: "eighth",
            },
          },
          source: "recipe",
        }),
      ),
    ).toBe("12/8 - Backbeat - Ride 3 per Beat Timekeeper");
  });

  it("groups odd beat counts into musical kick and snare anchors", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 7,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(pattern).toMatchObject({
      cycleTicks: RHYTHM_PPQ * 7,
      meter: { beats: 7, beatUnit: 4 },
    });
    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        { atTicks: 0, sampleId: "kick", velocity: 0.9 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "snare", velocity: 0.58 },
        { atTicks: RHYTHM_PPQ * 4, sampleId: "kick", velocity: 0.62 },
        { atTicks: RHYTHM_PPQ * 6, sampleId: "snare", velocity: 0.72 },
      ]),
    );
  });

  it("can reverse odd beat grouping", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 5,
        groove: "backbeat",
        grouping: "2+3",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });
    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "5/4 (2+3) - Backbeat - No Timekeeper",
    );
    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.62 },
      { atTicks: RHYTHM_PPQ * 4, sampleId: "snare", velocity: 0.72 },
    ]);
  });

  it("keeps four-beat backbeat variations musically distinct", () => {
    const halfTime = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "backbeat",
        grouping: "4",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });
    const push = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "backbeat",
        grouping: "3+1",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(halfTime.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "snare", velocity: 0.72 },
    ]);
    expect(push.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "snare", velocity: 0.72 },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.62 },
    ]);
  });

  it("keeps distinct grouping choices available for every beat count", () => {
    expect(
      [2, 3, 4, 5, 6, 7, 8].map((beats) => [
        beats,
        getRhythmGroupingOptions(beats),
      ]),
    ).toStrictEqual([
      [2, ["auto", "1+1"]],
      [3, ["auto", "2+1", "1+2"]],
      [4, ["auto", "4", "3+1"]],
      [5, ["auto", "2+3", "2+2+1"]],
      [6, ["auto", "2+4", "3+3"]],
      [7, ["auto", "3+4", "2+2+3"]],
      [8, ["auto", "3+3+2", "2+3+3"]],
    ]);
    expect(getRhythmGroupingChoiceLabel(2, "auto")).toBe("2");
    expect(getRhythmGroupingChoiceLabel(5, "auto")).toBe("3+2");
    expect(getRhythmGroupingChoiceLabel(6, "auto")).toBe("4+2");
    expect(
      getRhythmGroupingReadout({
        beats: 5,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toBe("3+2");
  });

  it("names extended beat counts as bars or additive meters", () => {
    expect(
      getRhythmTheoryReadout({
        beats: 8,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "2 Bars of 4/4",
      detail: "Simple Quadruple Meter • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 8,
        groove: "backbeat",
        grouping: "3+3+2",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "8/4",
      detail: "Additive Meter • 3+3+2 • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 6,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "6/4",
      detail: "Additive Meter • 4+2 • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 6,
        groove: "backbeat",
        grouping: "3+3",
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      title: "2 Bars of 9/8",
      detail: "Compound Triple Meter",
    });
  });

  it("normalizes raw tick patterns without mixer data", () => {
    expect(
      normalizeRhythmPattern({
        cycleTicks: RHYTHM_PPQ * 2,
        hits: [
          { atTicks: 0, sampleId: "kick", velocity: 1.4, volume: 0.2 },
          { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.55 },
          { atTicks: RHYTHM_PPQ * 2, sampleId: "snare" },
          { atTicks: RHYTHM_PPQ / 2, sampleId: "not-a-sample" },
        ],
        meter: { beats: 2, beatUnit: 4 },
        ppq: RHYTHM_PPQ,
        swing: { ratio: 0.6, unitTicks: RHYTHM_PPQ / 2 },
      }),
    ).toStrictEqual({
      cycleTicks: RHYTHM_PPQ * 2,
      hits: [
        { atTicks: 0, sampleId: "kick", velocity: 1 },
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.55 },
      ],
      meter: { beats: 2, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
      swing: { ratio: 0.6, unitTicks: RHYTHM_PPQ / 2 },
    });
  });

  it("rejects invalid custom rhythm patterns", () => {
    expect(
      normalizeRhythmPattern({
        cycleTicks: RHYTHM_PPQ * 4,
        hits: [{ atTicks: 0, sampleId: "kick" }],
        meter: { beats: 4, beatUnit: 4 },
        ppq: 96,
      }),
    ).toBeUndefined();
  });
});
