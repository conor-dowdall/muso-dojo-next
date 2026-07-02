import { describe, expect, it, vi } from "vitest";
import {
  RHYTHM_PPQ,
  type PercussionSampleId,
  type RhythmPattern,
} from "@/data/rhythmPresets";
import {
  RhythmPlaybackCoordinator,
  type RhythmPlaybackAudioEngine,
  type RhythmPlaybackRequest,
  type RhythmSchedulerFactory,
} from "@/audio/rhythmPlaybackCoordinator";
import { type PlaybackGroupHandle } from "@/audio/types";

function createPattern(sampleId: PercussionSampleId): RhythmPattern {
  return {
    cycleTicks: RHYTHM_PPQ * 4,
    hits: [{ atTicks: 0, sampleId }],
    meter: { beats: 4, beatUnit: 4 },
    ppq: RHYTHM_PPQ,
  };
}

function createRequest(pattern = createPattern("kick")): RhythmPlaybackRequest {
  return {
    id: "rhythm",
    pattern,
    tempoBpm: 60,
  };
}

function createHarness() {
  let currentTime = 10;
  let nextGroupId = 0;
  const schedulerOptions: Parameters<RhythmSchedulerFactory>[0][] = [];
  const schedulers: Array<{
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }> = [];
  const cancelPlaybackGroup = vi.fn();
  const schedulePercussionHit = vi.fn();
  const createScheduler: RhythmSchedulerFactory = (options) => {
    const scheduler = {
      isRunning: () => true,
      start: vi.fn(),
      stop: vi.fn(),
    };

    schedulerOptions.push(options);
    schedulers.push(scheduler);
    return scheduler;
  };
  const audioEngine: RhythmPlaybackAudioEngine = {
    cancelPlaybackGroup,
    createPlaybackGroup: () => `group-${nextGroupId++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime: async () => true,
    schedulePercussionHit,
    subscribeToStopAll: () => () => undefined,
  };
  const coordinator = new RhythmPlaybackCoordinator(
    audioEngine,
    createScheduler,
  );

  return {
    cancelPlaybackGroup,
    coordinator,
    schedulerOptions,
    schedulers,
    schedulePercussionHit,
    setCurrentTime: (value: number) => {
      currentTime = value;
    },
  };
}

describe("RhythmPlaybackCoordinator", () => {
  it("restarts from a fresh origin when the tempo changes", async () => {
    const { cancelPlaybackGroup, coordinator, schedulers, setCurrentTime } =
      createHarness();

    await coordinator.start(createRequest());
    setCurrentTime(12.08);

    await coordinator.start({
      ...createRequest(),
      tempoBpm: 120,
    });

    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(schedulers[1]?.start).toHaveBeenCalledWith(12.16);
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");
    expect(coordinator.getSnapshot()).toMatchObject({
      originTime: 12.16,
      playing: true,
      tempoBpm: 120,
    });
  });

  it("updates the pattern without moving the current origin", async () => {
    const { cancelPlaybackGroup, coordinator, schedulers, setCurrentTime } =
      createHarness();
    const nextPattern = createPattern("closed-hat");

    await coordinator.start(createRequest());
    setCurrentTime(11);

    expect(coordinator.setPattern("rhythm", nextPattern)).toBe(true);

    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(schedulers[1]?.start).toHaveBeenCalledWith(10.08);
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");
    expect(coordinator.getActiveRequest()?.pattern).toBe(nextPattern);
    expect(coordinator.getSnapshot()).toMatchObject({
      originTime: 10.08,
      playing: true,
    });
  });

  it("boosts rhythm hit playback without changing authored pattern data", async () => {
    const { coordinator, schedulerOptions, schedulePercussionHit } =
      createHarness();
    const pattern: RhythmPattern = {
      ...createPattern("kick"),
      hits: [{ atTicks: 0, sampleId: "kick", velocity: 0.5 }],
    };

    await coordinator.start(createRequest(pattern));
    const firstEvent = schedulerOptions[0]?.events[0];

    expect(firstEvent).toBeDefined();
    schedulerOptions[0]?.onSchedule(firstEvent!, 10.08, 0, 0);

    expect(pattern.hits[0]?.velocity).toBe(0.5);
    expect(schedulePercussionHit).toHaveBeenCalledWith({
      group: "group-0",
      sampleId: "kick",
      startTime: 10.08,
      velocity: 0.59,
    });
  });
});
