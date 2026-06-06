import { describe, expect, it } from "vitest";
import {
  audioPresets,
  getDefaultAudioPresetId,
  getAudioPresetsForSurface,
  isAudioPresetId,
  resolveAudioPreset,
} from "@/audio/presets";
import {
  type AudioPresetSurface,
  type AudioUse,
  type VoiceInsertEffectConfig,
} from "@/audio/types";

const audioUses = [
  "preview",
  "tuning",
  "drone",
  "exercise",
] as const satisfies readonly AudioUse[];

const defaultSurfaceByUse = {
  preview: "instrument",
  tuning: "instrument",
  drone: "drone",
  exercise: "instrument",
} as const satisfies Record<AudioUse, AudioPresetSurface>;

function isSupportedInsertEffectType(effect: VoiceInsertEffectConfig) {
  return ["chorus", "distortion"].includes(effect.type);
}

describe("audio presets", () => {
  it("keeps every playback default visible on its relevant picker", () => {
    audioUses.forEach((use) => {
      const preset = audioPresets[getDefaultAudioPresetId(use)];

      expect(preset.availableOn).toContain(defaultSurfaceByUse[use]);
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
    ).toBeGreaterThan(audioPresets["plucked-string"].defaultDurationSeconds);
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

  it("treats picker availability as metadata rather than a playback gate", () => {
    expect(
      resolveAudioPreset("plucked-string", getDefaultAudioPresetId("drone")),
    ).toBe(audioPresets["plucked-string"]);
    expect(
      resolveAudioPreset("missing", getDefaultAudioPresetId("drone")),
    ).toBe(audioPresets["reference-tone"]);
    expect(
      resolveAudioPreset("warm-pad", getDefaultAudioPresetId("drone")),
    ).toBe(audioPresets["warm-pad"]);
  });

  it("keeps drone defaults lean while allowing richer shared-effect options", () => {
    const dronePresets = getAudioPresetsForSurface("drone");
    const referenceTone = audioPresets["reference-tone"];
    const softOrgan = audioPresets["soft-organ"];
    const richerDronePresets = [
      audioPresets["bowed-strings"],
      audioPresets["warm-pad"],
    ];

    expect(dronePresets.map((preset) => preset.id)).toStrictEqual([
      "reference-tone",
      "soft-organ",
      "bowed-strings",
      "warm-pad",
    ]);
    expect(getDefaultAudioPresetId("drone")).toBe("reference-tone");
    expect(referenceTone.voice.partials).toStrictEqual([
      { multiple: 1, gain: 1 },
    ]);
    expect("lowPitchAssist" in referenceTone.voice).toBe(false);
    [referenceTone, softOrgan].forEach((preset) => {
      expect("insertEffects" in preset.voice).toBe(false);
      expect("unison" in preset.voice).toBe(false);
    });
    richerDronePresets.forEach((preset) => {
      expect(preset.voice.insertEffects?.map((effect) => effect.type)).toEqual([
        "chorus",
      ]);
      expect(preset.voice.unison?.detuneCents).toHaveLength(3);
    });
  });

  it("offers one flat, deliberately ordered instrument catalog", () => {
    expect(
      getAudioPresetsForSurface("instrument").map((preset) => preset.id),
    ).toStrictEqual([
      "reference-tone",
      "piano",
      "plucked-string",
      "picked-bass",
      "mandolin",
      "bowed-strings",
      "soft-organ",
      "warm-pad",
      "distortion-guitar",
      "glass-bell",
      "hollow-synth",
    ]);
    expect(Object.keys(audioPresets)).toHaveLength(11);
  });

  it("keeps retained voices distinct and rejects retired preset ids", () => {
    expect(audioPresets.piano.voice.envelope.decaySeconds).toBeGreaterThan(
      audioPresets["plucked-string"].voice.envelope.decaySeconds * 2,
    );
    expect(
      audioPresets["plucked-string"].voice.partials.at(-1)?.multiple ?? 0,
    ).toBeGreaterThan(audioPresets.piano.voice.partials.at(-1)?.multiple ?? 0);
    expect(audioPresets["distortion-guitar"].label).toContain("Guitar");
    expect(audioPresets["picked-bass"].label).toContain("Bass");
    expect(audioPresets.mandolin.description).toContain("paired-course");
    expect(isAudioPresetId("steel-string")).toBe(false);
    expect(isAudioPresetId("nylon-string")).toBe(false);
    expect(isAudioPresetId("bowed-sustain")).toBe(false);
  });
});
