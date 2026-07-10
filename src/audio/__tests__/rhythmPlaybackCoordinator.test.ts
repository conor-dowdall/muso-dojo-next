import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RhythmPlaybackCoordinator,
  type RhythmPlaybackAudioEngine,
  type RhythmPlaybackRequest,
} from "@/audio/rhythmPlaybackCoordinator";
import { RHYTHM_PPQ, type RhythmPattern } from "@/data/rhythmPresets";
import { type LookaheadScheduler } from "@/audio/lookaheadScheduler";
import { type PlaybackGroupHandle } from "@/audio/types";

function createPattern(sampleId: "kick" | "snare" = "kick"): RhythmPattern {
  return {
    cycleTicks: RHYTHM_PPQ * 4,
    hits: [{ atTicks: 0, sampleId }],
    meter: { beats: 4, beatUnit: 4 },
    ppq: RHYTHM_PPQ,
  };
}

function createRequest(
  id: string,
  settings: Partial<RhythmPlaybackRequest> = {},
): RhythmPlaybackRequest {
  return { id, pattern: createPattern(), tempoBpm: 60, ...settings };
}

function createScheduler() {
  return {
    isRunning: vi.fn(() => true),
    start: vi.fn(),
    stop: vi.fn(),
  } satisfies LookaheadScheduler;
}

function createHarness() {
  let currentTime = 10;
  let groupIndex = 0;
  let stopAllListener: () => void = () => undefined;
  const cancelPlaybackGroup = vi.fn();
  const schedulers: LookaheadScheduler[] = [];
  const audioEngine: RhythmPlaybackAudioEngine = {
    cancelPlaybackGroup,
    createPlaybackGroup: () => `group-${groupIndex++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime: async () => true,
    schedulePercussionHit: vi.fn(() => true),
    subscribeToStopAll: (listener) => {
      stopAllListener = listener;
      return () => undefined;
    },
  };
  const coordinator = new RhythmPlaybackCoordinator(audioEngine, () => {
    const scheduler = createScheduler();
    schedulers.push(scheduler);
    return scheduler;
  });

  return {
    cancelPlaybackGroup,
    coordinator,
    schedulers,
    setCurrentTime: (value: number) => {
      currentTime = value;
    },
    stopAll: () => stopAllListener(),
  };
}

describe("RhythmPlaybackCoordinator", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps independently started Rhythms active together", async () => {
    const { coordinator, schedulers } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    expect(Object.keys(coordinator.getSnapshot().playbacks)).toEqual([
      "a",
      "b",
    ]);
    expect(schedulers[0]?.stop).not.toHaveBeenCalled();
  });

  it("stops only the requested Rhythm", async () => {
    const { coordinator, schedulers } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    coordinator.stop("a");

    expect(coordinator.getSnapshot().playbacks.a).toBeUndefined();
    expect(coordinator.getSnapshot().playbacks.b).toBeDefined();
    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(schedulers[1]?.stop).not.toHaveBeenCalled();
  });

  it("restarts only the same ID when its pattern changes", async () => {
    const { cancelPlaybackGroup, coordinator, schedulers } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    expect(coordinator.setPattern("a", createPattern("snare"))).toBe(true);
    await Promise.resolve();

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      atTime: 10.08,
    });
    expect(schedulers[1]?.stop).not.toHaveBeenCalled();
  });

  it("schedules a future stop without affecting another Rhythm", async () => {
    vi.useFakeTimers();
    const { cancelPlaybackGroup, coordinator, schedulers } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    coordinator.stop("a", { atTime: 12 });
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", { atTime: 12 });
    expect(schedulers[0]?.stop).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(coordinator.getSnapshot().playbacks.b).toBeDefined();
  });

  it("resets all Rhythms when the engine stops all audio", async () => {
    const { coordinator, stopAll } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    stopAll();

    expect(coordinator.getSnapshot()).toMatchObject({
      pendingIds: [],
      playbacks: {},
      playing: false,
    });
  });
});
