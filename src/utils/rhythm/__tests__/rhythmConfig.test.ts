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

  it("normalizes impossible timekeeper combinations", () => {
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
      timekeeper: {
        feel: "straight",
        sound: "hat",
        subdivision: "quarter",
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
      "4 Beats - Ride Swing Eighth Timekeeper",
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
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.66 },
        { atTicks: RHYTHM_PPQ * 2, sampleId: "kick", velocity: 0.68 },
        { atTicks: RHYTHM_PPQ * 3, sampleId: "snare", velocity: 0.72 },
      ]),
    );
  });

  it("leaves the timekeeper lane silent when it is off", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
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

  it("generates triplet timekeeper hits without moving the groove lane", () => {
    const pattern = getRhythmSelectionPattern({
      recipe: {
        beats: 4,
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
        { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.66 },
        { atTicks: RHYTHM_PPQ / 3, sampleId: "closed-hat", velocity: 0.26 },
      ]),
    );
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
