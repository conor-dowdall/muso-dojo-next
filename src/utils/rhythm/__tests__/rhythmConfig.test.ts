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
  getRhythmTheoryReadout,
  RHYTHM_PPQ,
  rhythmRecipeSupportsTimekeeperFeel,
} from "@/data/rhythmPresets";

describe("rhythmConfig", () => {
  it("normalizes recipe rhythm selections without mixer data", () => {
    expect(
      normalizeRhythmSelection({
        recipe: {
          beats: 7,
          groove: "kit",
          grouping: "3+4",
          timekeeper: {
            feel: "swing",
            sound: "ride",
            subdivision: "2-per-beat",
            volume: 0.8,
          },
          volume: 0.2,
        },
        source: "recipe",
      }),
    ).toStrictEqual({
      recipe: {
        beats: 7,
        groove: "kit",
        grouping: "3+4",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "2-per-beat",
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

  it("normalizes legacy subdivisions before applying Rhythm policy", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "sixteenth",
        },
      }).timekeeper.subdivision,
    ).toBe("4-per-beat");
  });

  it("normalizes timekeeper modifiers to canonical subdivisions", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 5,
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "1-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 5,
      groove: "kit",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "hat",
        subdivision: "3-per-beat",
      },
    });
    expect(
      normalizeRhythmRecipe({
        beats: 5,
        timekeeper: {
          feel: "triplet",
          sound: "hat",
          subdivision: "4-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 5,
      groove: "kit",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "hat",
        subdivision: "6-per-beat",
      },
    });
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        timekeeper: {
          feel: "shuffle",
          sound: "ride",
          subdivision: "4-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "kit",
      grouping: "auto",
      timekeeper: {
        feel: "shuffle",
        sound: "ride",
        subdivision: "2-per-beat",
      },
    });
  });

  it("normalizes grouping against the beat count", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        groove: "kit",
        grouping: "2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "kit",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "hat",
        subdivision: "2-per-beat",
      },
    });
  });

  it("normalizes one-beat kit rhythms to pulse", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 1,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 1,
      groove: "pulse",
      grouping: "auto",
      timekeeper: {
        feel: "off",
        sound: "hat",
        subdivision: "2-per-beat",
      },
    });
  });

  it("preserves beat grouping across foundation grooves", () => {
    const pulseSelection = normalizeRhythmSelection({
      recipe: {
        beats: 5,
        groove: "pulse",
        grouping: "2+3",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });

    expect(getRhythmSelectionLabel(pulseSelection)).toBe(
      "5/4 (2+3) - Pulse - No Timekeeper",
    );
    expect(
      normalizeRhythmRecipe({
        beats: 5,
        groove: "pulse",
        grouping: "2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toMatchObject({
      beats: 5,
      groove: "pulse",
      grouping: "2+3",
    });
    expect(
      normalizeRhythmRecipe({
        beats: 7,
        groove: "bluegrass",
        grouping: "3+4",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toMatchObject({
      beats: 7,
      groove: "bluegrass",
      grouping: "3+4",
    });
  });

  it("normalizes moved offbeat timekeepers to straight drive timekeepers", () => {
    expect(
      normalizeRhythmRecipe({
        beats: 4,
        groove: "bluegrass",
        grouping: "auto",
        timekeeper: {
          feel: "shuffle",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 4,
      groove: "bluegrass",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "ride",
        subdivision: "2-per-beat",
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
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });

    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "4/4 - Kit - Ride Swing Timekeeper",
    );
    expect(pattern).toMatchObject({
      cycleTicks: RHYTHM_PPQ * 4,
      meter: { beats: 4, beatUnit: 4 },
      ppq: RHYTHM_PPQ,
    });
    expect(pattern.swing).toBeUndefined();
    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        { atTicks: 0, sampleId: "kick", velocity: 0.2 },
        { atTicks: 0, sampleId: "ride", velocity: 0.234 },
        { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.2 },
        {
          atTicks: RHYTHM_PPQ + Math.round((RHYTHM_PPQ * 2) / 3),
          sampleId: "ride",
          velocity: 0.108,
        },
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.24 },
        { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "snare", velocity: 0.28 },
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

  it("feathers swing kit kicks evenly while snares mark the variation", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 5,
        groove: "kit",
        grouping: "2+3",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        { atTicks: 0, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.24 },
        { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ * 4, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ * 4, sampleId: "snare", velocity: 0.28 },
      ]),
    );
  });

  it("retains grouping accents in the swing Pulse foundation", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "pulse",
        grouping: "auto",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual(
      expect.arrayContaining([
        { atTicks: 0, sampleId: "kick", velocity: 0.26 },
        { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.2 },
        { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.24 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.2 },
      ]),
    );
    expect(pattern.hits.some((hit) => hit.sampleId === "snare")).toBe(false);
  });

  it("keeps shuffle as a denser swung offbeat pattern", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "shuffle",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });

    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "4/4 - Kit - Ride Shuffle Timekeeper",
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
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
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
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });

    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "kick", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.68 },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.58 },
    ]);
  });

  it("can generate a flat bass-drum pulse", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 1,
        groove: "pulse",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });
    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "1/4 - Pulse - No Timekeeper",
    );
    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.68 },
    ]);
  });

  it("keeps two-beat swing phrasing out of one-beat loops", () => {
    expect(rhythmRecipeSupportsTimekeeperFeel("pulse", 1, "swing")).toBe(false);
    expect(rhythmRecipeSupportsTimekeeperFeel("pulse", 1, "shuffle")).toBe(
      true,
    );
    expect(
      normalizeRhythmRecipe({
        beats: 1,
        groove: "pulse",
        grouping: "auto",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      beats: 1,
      groove: "pulse",
      grouping: "auto",
      timekeeper: {
        feel: "straight",
        sound: "ride",
        subdivision: "2-per-beat",
      },
    });
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
          subdivision: "2-per-beat",
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
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.66 },
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

  it("generates three-per-beat timekeeper hits without moving the groove lane", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "3-per-beat",
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

  it("generates higher tuplet timekeeper densities inside each beat", () => {
    const createHatTicks = (subdivision: "5-per-beat" | "7-per-beat") => {
      const pattern = getRhythmSelectionPattern({
        recipe: {
          beats: 1,
          groove: "pulse",
          grouping: "auto",
          timekeeper: {
            feel: "straight",
            sound: "hat",
            subdivision,
          },
        },
        source: "recipe",
      });

      return pattern.hits
        .filter((hit) => hit.sampleId === "closed-hat")
        .map((hit) => hit.atTicks);
    };

    expect(createHatTicks("5-per-beat")).toEqual([
      0,
      RHYTHM_PPQ / 5,
      (RHYTHM_PPQ * 2) / 5,
      (RHYTHM_PPQ * 3) / 5,
      (RHYTHM_PPQ * 4) / 5,
    ]);
    expect(createHatTicks("7-per-beat")).toEqual(
      Array.from({ length: 7 }, (_, index) => (RHYTHM_PPQ * index) / 7),
    );
  });

  it("resolves recognized rhythm settings into music-theory readouts", () => {
    const selection = normalizeRhythmSelection({
      recipe: {
        beats: 2,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "3-per-beat",
        },
      },
      source: "recipe",
    });

    expect(getRhythmSelectionLabel(selection)).toBe(
      "6/8 - Kit - Hi-Hat 3 per Beat Timekeeper",
    );
    expect(getRhythmTheoryReadout(selection.recipe)).toStrictEqual({
      title: "6/8",
      detail: "Compound Duple • 2 Groups of 3 Eighths",
    });
  });

  it("uses theory-only labels for straight and compound readouts", () => {
    expect(
      getRhythmTheoryReadout({
        beats: 2,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "4-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "2/4",
      detail: "Simple Duple • Straight Sixteenths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 2,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "2/4",
      detail: "Simple Duple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 3,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "3/4",
      detail: "Simple Triple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 3,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "3-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "9/8",
      detail: "Compound Triple • 3 Groups of 3 Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "swing",
          sound: "ride",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple • Swing Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "ride",
          subdivision: "3-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "12/8",
      detail: "Compound Quadruple • 4 Groups of 3 Eighths",
    });
    expect(
      getRhythmSelectionLabel(
        normalizeRhythmSelection({
          recipe: {
            beats: 4,
            groove: "kit",
            grouping: "auto",
            timekeeper: {
              feel: "straight",
              sound: "ride",
              subdivision: "3-per-beat",
            },
          },
          source: "recipe",
        }),
      ),
    ).toBe("12/8 - Kit - Ride 3 per Beat Timekeeper");
  });

  it("keeps tuplets as subdivision details rather than new meter families", () => {
    expect(
      getRhythmTheoryReadout({
        beats: 2,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "5-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "2/4",
      detail: "Simple Duple • Quintuplets",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 3,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "7-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "3/4",
      detail: "Simple Triple • Septuplets",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "8-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple • Thirty-Second Notes",
    });
  });

  it("groups odd beat counts into musical kick and snare anchors", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 7,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
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
        groove: "kit",
        grouping: "2+3",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });
    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "5/4 (2+3) - Kit - No Timekeeper",
    );
    expect(pattern.hits).toEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.62 },
      { atTicks: RHYTHM_PPQ * 4, sampleId: "snare", velocity: 0.72 },
    ]);
  });

  it("keeps four-beat kit variations musically distinct", () => {
    const halfTime = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "kit",
        grouping: "4",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    });
    const push = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
        groove: "kit",
        grouping: "3+1",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
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
      [1, 2, 3, 4, 5, 6, 7, 8].map((beats) => [
        beats,
        getRhythmGroupingOptions(beats),
      ]),
    ).toStrictEqual([
      [1, ["auto"]],
      [2, ["auto"]],
      [3, ["auto", "2+1", "1+2"]],
      [4, ["auto", "4", "3+1"]],
      [5, ["auto", "2+3", "2+2+1"]],
      [6, ["auto", "4+2", "2+4"]],
      [7, ["auto", "3+4", "2+2+3"]],
      [8, ["auto", "3+3+2", "3+2+3"]],
    ]);
    expect(getRhythmGroupingChoiceLabel(1, "auto")).toBe("1");
    expect(getRhythmGroupingChoiceLabel(2, "auto")).toBe("2");
    expect(getRhythmGroupingChoiceLabel(5, "auto")).toBe("3+2");
    expect(getRhythmGroupingChoiceLabel(6, "auto")).toBe("3+3");
    expect(getRhythmGroupingChoiceLabel(6, "4+2")).toBe("4+2");
    expect(getRhythmGroupingChoiceLabel(6, "2+4")).toBe("2+4");
    expect(getRhythmGroupingChoiceLabel(8, "auto")).toBe("4+4");
    expect(getRhythmGroupingChoiceLabel(8, "3+3+2")).toBe("3+3+2");
    expect(getRhythmGroupingChoiceLabel(8, "3+2+3")).toBe("3+2+3");
  });

  it("plays the default six-beat rhythm as two complete bars of three", () => {
    const selection = {
      recipe: {
        beats: 6,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    } as const;
    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "3/4 × 2 - Kit - No Timekeeper",
    );
    expect(pattern).toMatchObject({
      cycleTicks: RHYTHM_PPQ * 6,
      meter: { beats: 6, beatUnit: 4 },
    });
    expect(pattern.hits).toStrictEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "snare", velocity: 0.72 },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ * 4, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 5, sampleId: "snare", velocity: 0.72 },
    ]);
  });

  it("plays the default eight-beat rhythm as two complete bars of four", () => {
    const selection = {
      recipe: {
        beats: 8,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "off",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      },
      source: "recipe",
    } as const;
    const pattern = getRhythmSelectionPattern(selection);

    expect(getRhythmSelectionLabel(selection)).toBe(
      "4/4 × 2 - Kit - No Timekeeper",
    );
    expect(pattern).toMatchObject({
      cycleTicks: RHYTHM_PPQ * 8,
      meter: { beats: 8, beatUnit: 4 },
    });
    expect(pattern.hits).toStrictEqual([
      { atTicks: 0, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.62 },
      { atTicks: RHYTHM_PPQ * 3, sampleId: "snare", velocity: 0.72 },
      { atTicks: RHYTHM_PPQ * 4, sampleId: "kick", velocity: 0.9 },
      { atTicks: RHYTHM_PPQ * 5, sampleId: "snare", velocity: 0.58 },
      { atTicks: RHYTHM_PPQ * 6, sampleId: "kick", velocity: 0.62 },
      { atTicks: RHYTHM_PPQ * 7, sampleId: "snare", velocity: 0.72 },
    ]);
  });

  it("keeps meter class and grouping details intentional", () => {
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "4",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 4,
        groove: "kit",
        grouping: "3+1",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4",
      detail: "Simple Quadruple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 8,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "4/4 × 2",
      detail: "Simple Quadruple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 8,
        groove: "kit",
        grouping: "3+3+2",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "8/4",
      detail: "Additive • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 8,
        groove: "kit",
        grouping: "3+2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "8/4",
      detail: "Additive • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 5,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "5/4",
      detail: "Additive • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 5,
        groove: "kit",
        grouping: "2+3",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "5/4",
      detail: "Additive • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 5,
        groove: "kit",
        grouping: "2+2+1",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "5/4",
      detail: "Additive • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 5,
        groove: "pulse",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "5/4",
      detail: "Additive • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 6,
        groove: "kit",
        grouping: "auto",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "3/4 × 2",
      detail: "Simple Triple • Straight Eighths",
    });
    expect(
      getRhythmTheoryReadout({
        beats: 6,
        groove: "kit",
        grouping: "4+2",
        timekeeper: {
          feel: "straight",
          sound: "hat",
          subdivision: "2-per-beat",
        },
      }),
    ).toStrictEqual({
      title: "6/4",
      detail: "Additive • Straight Eighths",
    });
  });

  it("always reports a meter class for normalized recipe combinations", () => {
    const grooves = ["pulse", "kit", "bluegrass"] as const;
    const timekeepers = [
      { feel: "off", sound: "hat", subdivision: "2-per-beat" },
      { feel: "straight", sound: "hat", subdivision: "1-per-beat" },
      { feel: "straight", sound: "hat", subdivision: "2-per-beat" },
      { feel: "straight", sound: "hat", subdivision: "4-per-beat" },
      { feel: "straight", sound: "ride", subdivision: "3-per-beat" },
      { feel: "straight", sound: "ride", subdivision: "5-per-beat" },
      { feel: "straight", sound: "ride", subdivision: "7-per-beat" },
      { feel: "swing", sound: "ride", subdivision: "2-per-beat" },
      { feel: "shuffle", sound: "shaker", subdivision: "2-per-beat" },
    ] as const;

    for (let beats = 1; beats <= 8; beats += 1) {
      for (const grouping of getRhythmGroupingOptions(beats)) {
        for (const groove of grooves) {
          for (const timekeeper of timekeepers) {
            const recipe = normalizeRhythmRecipe({
              beats,
              groove,
              grouping,
              timekeeper,
            });
            const readout = getRhythmTheoryReadout(recipe);

            expect(readout.detail, JSON.stringify(recipe)).toMatch(
              /^(Simple|Compound|Additive)\b/,
            );
          }
        }
      }
    }
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
