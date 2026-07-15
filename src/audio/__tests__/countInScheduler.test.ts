import { describe, expect, it, vi } from "vitest";
import {
  scheduleCountInClicks,
  type CountInSchedulerAudioEngine,
} from "@/audio/countInScheduler";
import { type PlaybackGroupHandle } from "@/audio/types";

const group = "count-in" as PlaybackGroupHandle;

function createAudioEngine() {
  return {
    scheduleMetronomeClick: vi.fn(() => true),
  } satisfies CountInSchedulerAudioEngine;
}

describe("scheduleCountInClicks", () => {
  it("spaces pulses across the full duration and accents only the first", () => {
    const audioEngine = createAudioEngine();

    expect(
      scheduleCountInClicks(audioEngine, {
        durationSeconds: 3,
        group,
        pulses: 2,
        startTime: 10,
      }),
    ).toBe(2);
    expect(audioEngine.scheduleMetronomeClick).toHaveBeenNthCalledWith(1, {
      accent: true,
      group,
      startTime: 10,
    });
    expect(audioEngine.scheduleMetronomeClick).toHaveBeenNthCalledWith(2, {
      accent: false,
      group,
      startTime: 11.5,
    });
  });

  it("does not schedule clicks inside the unsafe lead window", () => {
    const audioEngine = createAudioEngine();

    expect(
      scheduleCountInClicks(audioEngine, {
        durationSeconds: 4,
        group,
        minimumStartTime: 11.5,
        pulses: 4,
        startTime: 10,
      }),
    ).toBe(2);
    expect(audioEngine.scheduleMetronomeClick).toHaveBeenNthCalledWith(1, {
      accent: false,
      group,
      startTime: 12,
    });
    expect(audioEngine.scheduleMetronomeClick).toHaveBeenNthCalledWith(2, {
      accent: false,
      group,
      startTime: 13,
    });
  });

  it("ignores invalid count-ins", () => {
    const audioEngine = createAudioEngine();

    expect(
      scheduleCountInClicks(audioEngine, {
        durationSeconds: 0,
        group,
        pulses: 4,
        startTime: 10,
      }),
    ).toBe(0);
    expect(
      scheduleCountInClicks(audioEngine, {
        durationSeconds: 4,
        group,
        pulses: Number.POSITIVE_INFINITY,
        startTime: 10,
      }),
    ).toBe(0);
    expect(audioEngine.scheduleMetronomeClick).not.toHaveBeenCalled();
  });
});
