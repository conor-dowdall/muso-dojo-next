import { describe, expect, it } from "vitest";
import {
  getAudioEffectChainTailSeconds,
  getAudioEffectConfigTailSeconds,
} from "@/audio/effects";
import {
  DEFAULT_MASTER_AMBIENCE_PRESET_ID,
  getMasterAmbiencePreset,
  isMasterAmbiencePresetId,
  masterAmbiencePresets,
  resolveMasterAmbiencePresetId,
} from "@/audio/masterAmbience";

describe("audio effects", () => {
  it("models tone-shaping effects without release tails", () => {
    const effect = {
      type: "distortion",
      amount: 0.2,
      mix: 0.5,
    } as const;

    expect(getAudioEffectConfigTailSeconds(effect)).toBe(0);
  });

  it("estimates reverb tails from pre-delay and decay", () => {
    const effect = {
      type: "reverb",
      decaySeconds: 1.4,
      mix: 0.2,
      preDelaySeconds: 0.03,
    } as const;

    expect(getAudioEffectConfigTailSeconds(effect)).toBeCloseTo(1.43);
  });

  it("estimates delay tails from feedback and mix", () => {
    expect(
      getAudioEffectConfigTailSeconds({
        type: "delay",
        feedback: 0.5,
        mix: 0.2,
        timeSeconds: 0.25,
      }),
    ).toBeCloseTo(2.5);
    expect(
      getAudioEffectConfigTailSeconds({
        type: "delay",
        feedback: 0.5,
        mix: 0,
        timeSeconds: 0.25,
      }),
    ).toBe(0);
  });

  it("sums serial effect tails conservatively", () => {
    expect(
      getAudioEffectChainTailSeconds([
        {
          type: "chorus",
          depthSeconds: 0.004,
          mix: 0.25,
          rateHz: 0.35,
        },
        {
          type: "reverb",
          decaySeconds: 0.8,
          mix: 0.1,
          preDelaySeconds: 0.02,
        },
      ]),
    ).toBeCloseTo(0.842);
  });

  it("defines a focused default master ambience and a dry escape hatch", () => {
    expect(DEFAULT_MASTER_AMBIENCE_PRESET_ID).toBe("dojo-room");
    expect(getMasterAmbiencePreset("dry").effects).toHaveLength(0);
    expect(
      masterAmbiencePresets[DEFAULT_MASTER_AMBIENCE_PRESET_ID].effects.length,
    ).toBeGreaterThan(0);
    expect(isMasterAmbiencePresetId("warm-hall")).toBe(true);
    expect(resolveMasterAmbiencePresetId("missing")).toBe(
      DEFAULT_MASTER_AMBIENCE_PRESET_ID,
    );
  });
});
