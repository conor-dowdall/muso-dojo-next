import { describe, expect, it } from "vitest";
import { scheduleOneShotEnvelope } from "@/audio/envelope";

class MockAudioParam {
  readonly events: Array<{
    time: number;
    type: "cancel" | "ramp" | "set";
    value?: number;
  }> = [];

  cancelScheduledValues(time: number) {
    this.events.push({ time, type: "cancel" });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "ramp", value });
    return this;
  }

  setValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "set", value });
    return this;
  }
}

describe("scheduleOneShotEnvelope", () => {
  it("preserves click-safe ramps when a long preset envelope is shortened", () => {
    const param = new MockAudioParam();
    const startTime = 2;
    const durationSeconds = 0.225;
    const minimumRampSeconds = 128 / 48_000;

    scheduleOneShotEnvelope({
      durationSeconds,
      envelope: {
        attackSeconds: 0.002,
        decaySeconds: 1.18,
        sustainGain: 0.075,
        releaseSeconds: 0.24,
      },
      minimumAttackSeconds: minimumRampSeconds,
      minimumReleaseSeconds: minimumRampSeconds,
      param: param as unknown as AudioParam,
      peakGain: 1,
      startTime,
    });

    const ramps = param.events.filter((event) => event.type === "ramp");
    const attackEnd = ramps[0]?.time;
    const releaseStart = param.events.at(-2)?.time;
    const endTime = ramps.at(-1)?.time;

    expect(attackEnd).toBeGreaterThanOrEqual(startTime + minimumRampSeconds);
    expect(releaseStart).toBeLessThanOrEqual(
      startTime + durationSeconds - minimumRampSeconds,
    );
    expect(endTime).toBe(startTime + durationSeconds);
    expect(ramps.at(-1)?.value).toBe(0);
  });
});
