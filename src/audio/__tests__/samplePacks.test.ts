import { describe, expect, it } from "vitest";
import { samplePacks } from "@/audio/samplePacks.generated";

describe("generated sample packs", () => {
  it("includes one exact click region for the metronome pack", () => {
    const metronome = samplePacks.metronome;
    const [click] = metronome.regions;

    expect(metronome.regions).toHaveLength(1);
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
});
