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
import { RHYTHM_PPQ } from "@/data/rhythmPresets";

describe("rhythmConfig", () => {
  it("normalizes recipe rhythm selections without mixer data", () => {
    expect(
      normalizeRhythmSelection({
        recipe: {
          beats: 7,
          groove: "kick",
          grouping: "4+3",
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
        groove: "kick",
        grouping: "4+3",
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
  });

  it("normalizes grouping against the beat count", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        groove: "kick",
        grouping: "2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "eighth",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "kick",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "hat",
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
      "4 Beats (4/4 Feel) - Backbeat - Ride Swing Timekeeper",
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
        { atTicks: 0, sampleId: "ride", velocity: 0.52 },
        {
          atTicks: Math.round((RHYTHM_PPQ * 2) / 3),
          sampleId: "ride",
          velocity: 0.24,
        },
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
        { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.62 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "snare", velocity: 0.72 },
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
          feel: "straight",
          sound: "off",
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
        groove: "kick",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "off",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.56 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.68 },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.56 },
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
        { atTicks: RHYTHM_PPQ / 3, sampleId: "closed-hat", velocity: 0.26 },
      ]),
    );
  });

  it("labels two three-subdivision beats as a 6/8 feel", () => {
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
      "2 Beats (6/8 Feel) - Backbeat - Hat 3 / Beat Timekeeper",
    );
  });

  it("labels common straight and compound beat feels", () => {
    expect(
      getRhythmSelectionLabel(
        normalizeRhythmSelection({
          recipe: {
            beats: 3,
            groove: "backbeat",
            grouping: "auto",
            timekeeper: {
              feel: "straight",
              sound: "hat",
              subdivision: "eighth",
            },
          },
          source: "recipe",
        }),
      ),
    ).toBe("3 Beats (3/4 Feel) - Backbeat - Hat 2 / Beat Timekeeper");
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
    ).toBe("4 Beats (12/8 Feel) - Backbeat - Ride 3 / Beat Timekeeper");
  });

  it("groups odd beat counts into musical kick and snare anchors", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 7,
        groove: "backbeat",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "off",
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
          feel: "straight",
          sound: "off",
          subdivision: "eighth",
        },
      },
      source: "recipe",
    });
    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "5 Beats (5/4 Feel, 2+3) - Backbeat - No Timekeeper",
    );
    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.62 },
      { atTicks: RHYTHM_PPQ * 4, sampleId: "snare", velocity: 0.72 },
    ]);
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
