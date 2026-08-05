import { describe, expect, it } from "vitest";
import {
  isAudioPrecacheManifestEntry,
  isWavAudioRuntimeCachePath,
  LEGACY_AUDIO_RUNTIME_CACHE_NAMES,
  normalizePrecacheManifestUrl,
  shouldPrecacheAudioManifestEntry,
} from "@/audio/audioCachePolicy.js";

describe("audio cache policy", () => {
  it("normalizes Serwist's pre-rebase public paths", () => {
    expect(normalizePrecacheManifestUrl("public/audio/v1/piano.ogg")).toBe(
      "/audio/v1/piano.ogg",
    );
    expect(normalizePrecacheManifestUrl("/audio/v1/piano.ogg")).toBe(
      "/audio/v1/piano.ogg",
    );
  });

  it("precaches default Ogg assets and excludes other audio files", () => {
    expect(shouldPrecacheAudioManifestEntry("public/audio/v1/piano.ogg")).toBe(
      true,
    );
    expect(shouldPrecacheAudioManifestEntry("public/audio/v1/piano.wav")).toBe(
      false,
    );
    expect(
      shouldPrecacheAudioManifestEntry("public/audio/v1/attribution.json"),
    ).toBe(false);
    expect(
      isAudioPrecacheManifestEntry("public/fonts/InterVariable.woff2"),
    ).toBe(false);
  });

  it("reserves runtime audio caching for same-path WAV matching", () => {
    expect(isWavAudioRuntimeCachePath("/audio/v1/piano.wav")).toBe(true);
    expect(isWavAudioRuntimeCachePath("/audio/v1/piano.ogg")).toBe(false);
    expect(isWavAudioRuntimeCachePath("/elsewhere/piano.wav")).toBe(false);
  });

  it("cleans both historical audio runtime caches after activation", () => {
    expect(LEGACY_AUDIO_RUNTIME_CACHE_NAMES).toStrictEqual([
      "audio-sample-packs-v1",
      "static-audio-assets",
    ]);
  });
});
