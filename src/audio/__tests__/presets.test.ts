import { describe, expect, it } from "vitest";
import {
  audioPresets,
  getAudioPresetsForSurface,
  getDefaultAudioPresetId,
  isAudioPresetId,
  resolveAudioPreset,
} from "@/audio/presets";
import {
  type AudioPresetSurface,
  type AudioUse,
  type SamplePackId,
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
  exercise: "exercise",
} as const satisfies Record<AudioUse, AudioPresetSurface>;

describe("audio presets", () => {
  it("keeps every playback default visible on its relevant picker", () => {
    audioUses.forEach((use) => {
      const preset = audioPresets[getDefaultAudioPresetId(use)];

      expect(preset.samplePackId).toBe(preset.id);
      expect(preset.availableOn).toContain(defaultSurfaceByUse[use]);
      expect(resolveAudioPreset(preset.id, getDefaultAudioPresetId(use))).toBe(
        preset,
      );
    });
  });

  it("offers a focused sample-backed instrument catalog", () => {
    expect(
      getAudioPresetsForSurface("instrument").map((preset) => preset.id),
    ).toStrictEqual(["piano", "plucked-string", "bowed-strings"]);
    expect(
      getAudioPresetsForSurface("exercise").map((preset) => preset.id),
    ).toStrictEqual(["piano", "plucked-string", "bowed-strings"]);
    expect(
      getAudioPresetsForSurface("drone").map((preset) => preset.id),
    ).toEqual(["bowed-strings"]);
  });

  it("maps visible presets to generated sample packs", () => {
    const expectedPackByPreset = {
      piano: "piano",
      "plucked-string": "plucked-string",
      "bowed-strings": "bowed-strings",
    } as const satisfies Record<string, SamplePackId>;

    Object.entries(expectedPackByPreset).forEach(([presetId, samplePackId]) => {
      expect(audioPresets[presetId as keyof typeof audioPresets]).toMatchObject(
        {
          samplePackId,
        },
      );
    });
  });

  it("falls back to the supplied default for unknown preset ids", () => {
    expect(resolveAudioPreset("missing", "bowed-strings")).toBe(
      audioPresets["bowed-strings"],
    );
    expect(isAudioPresetId("steel-string")).toBe(false);
    expect(isAudioPresetId("nylon-string")).toBe(false);
    expect(isAudioPresetId("reference-tone")).toBe(false);
  });

  it("uses string samples as the drone default", () => {
    expect(getDefaultAudioPresetId("drone")).toBe("bowed-strings");
    expect(
      audioPresets["bowed-strings"].defaultDurationSeconds,
    ).toBeGreaterThan(audioPresets["plucked-string"].defaultDurationSeconds);
  });
});
