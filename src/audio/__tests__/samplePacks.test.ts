import { describe, expect, it } from "vitest";
import { getPlaybackRate } from "@/audio/samplePackLibrary";
import { samplePacks } from "@/audio/samplePacks.generated";

describe("generated sample packs", () => {
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
