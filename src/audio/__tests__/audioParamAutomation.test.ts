import { describe, expect, it } from "vitest";
import { createAudioParamAutomation } from "@/audio/audioParamAutomation";

class MockAudioParam {
  readonly events: Array<{
    time: number;
    type: "cancel" | "exponentialRamp" | "linearRamp" | "set";
    value?: number;
  }> = [];

  cancelScheduledValues(time: number) {
    this.events.push({ time, type: "cancel" });
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "exponentialRamp", value });
    return this;
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "linearRamp", value });
    return this;
  }

  setValueAtTime(value: number, time: number) {
    this.events.push({ time, type: "set", value });
    return this;
  }
}

describe("createAudioParamAutomation", () => {
  it("holds the calculated value when an exponential ramp is interrupted", () => {
    const param = new MockAudioParam();
    const automation = createAudioParamAutomation({
      initialValue: 220,
      params: [param as unknown as AudioParam],
      startTime: 0,
    });

    automation.exponentialRampToValueAtTime(440, 0, 1);
    automation.exponentialRampToValueAtTime(110, 0.5, 0.5);

    const heldValue = param.events.find(
      (event) => event.type === "set" && event.time === 0.5,
    )?.value;

    expect(heldValue).toBeCloseTo(Math.sqrt(220 * 440));
    expect(automation.getValueAtTime(1)).toBe(110);
  });

  it("holds the calculated value when a linear ramp is interrupted", () => {
    const param = new MockAudioParam();
    const automation = createAudioParamAutomation({
      initialValue: 0.8,
      params: [param as unknown as AudioParam],
      startTime: 0,
    });

    automation.linearRampToValueAtTime(0.4, 0, 1);
    automation.linearRampToValueAtTime(0.6, 0.25, 0.5);

    const heldValue = param.events.find(
      (event) => event.type === "set" && event.time === 0.25,
    )?.value;

    expect(heldValue).toBeCloseTo(0.7);
    expect(automation.getValueAtTime(0.75)).toBeCloseTo(0.6);
  });
});
