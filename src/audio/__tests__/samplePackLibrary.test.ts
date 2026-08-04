import { describe, expect, it } from "vitest";
import {
  getConcertPitchHz,
  getLoopEndSeconds,
  getLoopStartSeconds,
  getRegionEndSeconds,
  getScheduledOffset,
} from "@/audio/samplePackLibrary";
import { samplePacks } from "@/audio/samplePacks.generated";
import { DEFAULT_CONCERT_PITCH_HZ } from "@/audio/pitch";

describe("getConcertPitchHz", () => {
  it("falls back to the default for a negative frequency", () => {
    expect(getConcertPitchHz(-440)).toBe(DEFAULT_CONCERT_PITCH_HZ);
  });
});

describe("getScheduledOffset", () => {
  it("advances a late non-looped voice by its playback rate", () => {
    const region = samplePacks.percussion.regions[0];
    const lateBufferSeconds = region.durationSeconds / 2;
    const context = {
      currentTime: 10 + lateBufferSeconds / 2,
    } as AudioContext;

    expect(
      getScheduledOffset({
        context,
        loop: false,
        playbackRate: 2,
        region,
        startTime: 10,
      }),
    ).toBeCloseTo(region.offsetSeconds + lateBufferSeconds);
  });

  it("drops a late non-looped voice after its sample region has ended", () => {
    const region = samplePacks.percussion.regions[0];
    const context = {
      currentTime: 10 + region.durationSeconds / 2,
    } as AudioContext;

    expect(
      getScheduledOffset({
        context,
        loop: false,
        playbackRate: 2,
        region,
        startTime: 10,
      }),
    ).toBeUndefined();
  });

  it("wraps a late looped voice into its declared loop region", () => {
    const region = samplePacks.piano.regions[0];
    const loopStart = getLoopStartSeconds(region)!;
    const loopEnd = getLoopEndSeconds(region)!;
    const preLoopSeconds = loopStart - region.offsetSeconds;
    const loopDurationSeconds = loopEnd - loopStart;
    const lateBufferSeconds = preLoopSeconds + loopDurationSeconds * 2 + 0.25;
    const playbackRate = 1.5;
    const context = {
      currentTime: 10 + lateBufferSeconds / playbackRate,
    } as AudioContext;

    expect(
      getScheduledOffset({
        context,
        loop: true,
        playbackRate,
        region,
        startTime: 10,
      }),
    ).toBeCloseTo(loopStart + 0.25);
    expect(loopEnd).toBeLessThanOrEqual(getRegionEndSeconds(region) + 0.001);
  });
});
