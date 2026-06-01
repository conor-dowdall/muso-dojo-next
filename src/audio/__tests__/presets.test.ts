import { describe, expect, it } from "vitest";
import {
  audioPresets,
  getDefaultAudioPresetId,
  resolveAudioPreset,
} from "@/audio/presets";
import { type AudioUse, type VoiceInsertEffectConfig } from "@/audio/types";

const audioUses = [
  "preview",
  "tuning",
  "drone",
  "exercise",
] as const satisfies readonly AudioUse[];

function isSupportedInsertEffectType(effect: VoiceInsertEffectConfig) {
  return ["chorus", "distortion"].includes(effect.type);
}

describe("audio presets", () => {
  it("keeps every default use pointed at a compatible preset", () => {
    audioUses.forEach((use) => {
      const preset = audioPresets[getDefaultAudioPresetId(use)];

      expect(preset.recommendedUses).toContain(use);
      expect(resolveAudioPreset(preset.id, getDefaultAudioPresetId(use))).toBe(
        preset,
      );
    });
  });

  it("gives every preset a natural one-shot duration", () => {
    Object.values(audioPresets).forEach((preset) => {
      expect(preset.defaultDurationSeconds).toBeGreaterThanOrEqual(0.2);
      expect(preset.defaultDurationSeconds).toBeLessThanOrEqual(1.6);
    });
    expect(
      audioPresets["bowed-strings"].defaultDurationSeconds,
    ).toBeGreaterThan(audioPresets["steel-string"].defaultDurationSeconds);
    expect(
      audioPresets["bowed-sustain"].defaultDurationSeconds,
    ).toBeGreaterThan(audioPresets["bowed-strings"].defaultDurationSeconds);
    expect(audioPresets.mandolin.defaultDurationSeconds).toBeLessThan(
      audioPresets.piano.defaultDurationSeconds,
    );
  });

  it("uses insert effects for preset sound shaping", () => {
    Object.values(audioPresets).forEach((preset) => {
      const effects: readonly VoiceInsertEffectConfig[] | undefined =
        "insertEffects" in preset.voice
          ? preset.voice.insertEffects
          : undefined;

      effects?.forEach((effect) => {
        expect(isSupportedInsertEffectType(effect)).toBe(true);
      });
    });
  });

  it("treats recommended uses as metadata rather than playback gates", () => {
    expect(
      resolveAudioPreset("steel-string", getDefaultAudioPresetId("drone")),
    ).toBe(audioPresets["steel-string"]);
    expect(
      resolveAudioPreset("missing", getDefaultAudioPresetId("drone")),
    ).toBe(audioPresets["soft-organ"]);
  });

  it("keeps the focused catalog broad enough for the current instruments", () => {
    expect(Object.keys(audioPresets)).toHaveLength(16);
    expect(audioPresets.piano.category).toBe("core");
    expect(audioPresets["steel-string"].recommendedUses).toContain("preview");
    expect(audioPresets["distortion-guitar"].label).toContain("Guitar");
    expect(audioPresets["picked-bass"].label).toContain("Bass");
    expect(audioPresets.mandolin.description).toContain("paired-course");
    expect(audioPresets["bowed-sustain"].recommendedUses).toContain("drone");
  });
});
