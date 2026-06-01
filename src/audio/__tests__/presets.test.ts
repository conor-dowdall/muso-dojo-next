import { describe, expect, it } from "vitest";
import {
  audioPresets,
  getDefaultAudioPresetId,
  resolveAudioPreset,
} from "@/audio/presets";
import { type AudioEffectConfig, type AudioUse } from "@/audio/types";

const audioUses = [
  "preview",
  "tuning",
  "drone",
  "exercise",
] as const satisfies readonly AudioUse[];

function isSupportedEffectType(effect: AudioEffectConfig) {
  return ["chorus", "delay", "distortion", "reverb"].includes(effect.type);
}

describe("audio presets", () => {
  it("keeps every default use pointed at a compatible preset", () => {
    audioUses.forEach((use) => {
      const preset = audioPresets[getDefaultAudioPresetId(use)];

      expect(preset.supports).toContain(use);
      expect(resolveAudioPreset(use, preset.id)).toBe(preset);
    });
  });

  it("uses the generic effect list for preset sound shaping", () => {
    Object.values(audioPresets).forEach((preset) => {
      const effects: readonly AudioEffectConfig[] | undefined =
        "effects" in preset.voice ? preset.voice.effects : undefined;

      effects?.forEach((effect) => {
        expect(isSupportedEffectType(effect)).toBe(true);
      });
    });
  });
});
