import { describe, expect, it } from "vitest";
import { getPlaybackRate } from "@/audio/samplePackLibrary";
import { samplePacks } from "@/audio/samplePacks.generated";

describe("generated sample packs", () => {
  it("includes curated Acoustic Bass regions across its native register", () => {
    const acousticBass = samplePacks["acoustic-bass"];

    expect(acousticBass.regions.map((region) => region.rootMidi)).toEqual([
      28, 29, 36, 41, 46, 54, 60, 66, 72,
    ]);
    expect(
      acousticBass.regions.map((region) => [
        region.lowMidi,
        region.rootMidi,
        region.highMidi,
      ]),
    ).toEqual([
      [0, 28, 28],
      [29, 29, 29],
      [30, 36, 36],
      [37, 41, 41],
      [42, 46, 46],
      [47, 54, 54],
      [55, 60, 60],
      [61, 66, 66],
      [67, 72, 127],
    ]);
    expect(
      acousticBass.regions.map((region) => region.sourceSampleName),
    ).toEqual([
      "Acoustic Bass E2",
      "Acoustic Bass F2",
      "Acoustic Bass C3",
      "Acoustic Bass F3",
      "Acoustic Bass A#3",
      "Acoustic Bass F#4",
      "Acoustic Bass C5",
      "Acoustic Bass F#5",
      "Acoustic Bass C6",
    ]);
  });

  it("gives every pitched pack complete, contiguous MIDI coverage", () => {
    const pitchedPackIds = [
      "piano",
      "plucked-string",
      "bowed-strings",
      "acoustic-bass",
    ] as const;

    pitchedPackIds.forEach((packId) => {
      const regions = samplePacks[packId].regions;

      expect(regions.at(0)?.lowMidi, packId).toBe(0);
      expect(regions.at(-1)?.highMidi, packId).toBe(127);
      expect(new Set(regions.map((region) => region.id)).size, packId).toBe(
        regions.length,
      );

      regions.forEach((region, index) => {
        expect(
          region.rootMidi,
          `${packId}:${region.id}`,
        ).toBeGreaterThanOrEqual(region.lowMidi);
        expect(region.rootMidi, `${packId}:${region.id}`).toBeLessThanOrEqual(
          region.highMidi,
        );

        if (index > 0) {
          expect(region.lowMidi, `${packId}:${region.id}`).toBe(
            regions[index - 1]!.highMidi + 1,
          );
        }
      });
    });
  });

  it("includes the metronome click inside the percussion pack", () => {
    const percussion = samplePacks.percussion;
    const click = percussion.regions.find(
      (region) => region.id === "percussion-metronome-click",
    );

    expect(click).toMatchObject({
      durationSeconds: expect.any(Number),
      exclusiveClass: 0,
      highMidi: 33,
      lowMidi: 33,
      rootMidi: 33,
      sourceSampleName: "Metronome Click",
      velocityHigh: 127,
      velocityLow: 0,
    });
    expect(click?.durationSeconds).toBeLessThan(0.02);
  });

  it("includes the core one-shot percussion regions", () => {
    expect(samplePacks.percussion.regions.map((region) => region.id)).toEqual([
      "percussion-metronome-click",
      "percussion-kick",
      "percussion-side-stick",
      "percussion-snare",
      "percussion-closed-hat",
      "percussion-pedal-hat",
      "percussion-open-hat",
      "percussion-crash",
      "percussion-ride",
      "percussion-tambourine",
      "percussion-claves",
      "percussion-high-woodblock",
      "percussion-low-woodblock",
      "percussion-shaker",
    ]);
  });

  it("applies SoundFont fine tune with the browser playback-rate sign", () => {
    const nylonG = samplePacks["plucked-string"].regions.find(
      (region) => region.id === "plucked-string-55",
    );
    const nylonE = samplePacks["plucked-string"].regions.find(
      (region) => region.id === "plucked-string-76",
    );

    expect(nylonG).toMatchObject({
      rootCents: 5489,
      sourceSampleName: "Nylon G4",
    });
    expect(nylonE).toMatchObject({
      rootCents: 7613,
      sourceSampleName: "Nylon E6",
    });
    expect(
      getPlaybackRate({
        concertPitchHz: 440,
        midiNote: 55,
        region: nylonG!,
      }),
    ).toBeCloseTo(2 ** (11 / 1200), 5);
    expect(
      getPlaybackRate({
        concertPitchHz: 440,
        midiNote: 76,
        region: nylonE!,
      }),
    ).toBeCloseTo(2 ** (-13 / 1200), 5);
  });
});
