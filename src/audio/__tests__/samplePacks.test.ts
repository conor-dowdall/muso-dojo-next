import { describe, expect, it } from "vitest";
import { samplePacks } from "@/audio/samplePacks.generated";

describe("generated sample packs", () => {
  it("includes exact woodblock regions for the metronome pack", () => {
    const metronome = samplePacks.metronome;
    const regular = metronome.regions.find(
      (region) => region.id === "metronome-regular",
    );
    const accent = metronome.regions.find(
      (region) => region.id === "metronome-accent",
    );

    expect(regular).toMatchObject({
      exclusiveClass: 0,
      highMidi: 77,
      lowMidi: 77,
      rootMidi: 77,
      sourceSampleName: "Low Woodblock(L)",
      velocityHigh: 127,
      velocityLow: 0,
    });
    expect(accent).toMatchObject({
      exclusiveClass: 0,
      highMidi: 76,
      lowMidi: 76,
      rootMidi: 76,
      sourceSampleName: "High Woodblock(L)",
      velocityHigh: 127,
      velocityLow: 0,
    });
  });
});
