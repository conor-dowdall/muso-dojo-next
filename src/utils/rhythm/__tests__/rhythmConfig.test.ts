import { describe, expect, it } from "vitest";
import {
  DEFAULT_RHYTHM_SELECTION,
  normalizeRhythmPattern,
  normalizeRhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { RHYTHM_PPQ } from "@/data/rhythmPresets";

describe("rhythmConfig", () => {
  it("normalizes preset rhythm selections", () => {
    expect(
      normalizeRhythmSelection({
        presetId: "six-eight",
        source: "preset",
        volume: 0.2,
      }),
    ).toStrictEqual({
      presetId: "six-eight",
      source: "preset",
    });
  });

  it("falls back to the default rhythm for unknown selections", () => {
    expect(
      normalizeRhythmSelection({
        presetId: "not-a-rhythm",
        source: "preset",
      }),
    ).toStrictEqual(DEFAULT_RHYTHM_SELECTION);
    expect(normalizeRhythmSelection(undefined)).toStrictEqual(
      DEFAULT_RHYTHM_SELECTION,
    );
  });

  it("normalizes future custom tick patterns without mixer data", () => {
    const normalized = normalizeRhythmSelection({
      basedOnPresetId: "simple-4-4",
      name: "  My Beat  ",
      pattern: {
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
      },
      source: "custom",
      volume: 0.4,
    });

    expect(normalized).toStrictEqual({
      basedOnPresetId: "simple-4-4",
      name: "My Beat",
      pattern: {
        cycleTicks: RHYTHM_PPQ * 2,
        hits: [
          { atTicks: 0, sampleId: "kick", velocity: 1 },
          { atTicks: RHYTHM_PPQ, sampleId: "snare", velocity: 0.55 },
        ],
        meter: { beats: 2, beatUnit: 4 },
        ppq: RHYTHM_PPQ,
        swing: { ratio: 0.6, unitTicks: RHYTHM_PPQ / 2 },
      },
      source: "custom",
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
