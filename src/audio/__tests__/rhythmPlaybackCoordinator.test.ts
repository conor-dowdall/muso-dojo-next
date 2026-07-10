import { afterEach, describe, expect, it, vi } from "vitest";
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
  const clearPlaybackGroupCancellation = vi.fn(() => true);
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
    clearPlaybackGroupCancellation,
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
    clearPlaybackGroupCancellation,
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("arms a handoff on the audio clock before the commit timer can be delayed", async () => {
    vi.useFakeTimers();
    const { cancelPlaybackGroup, coordinator, schedulers, setCurrentTime } =
      createHarness();

    await coordinator.start(createRequest(createPattern("kick")));
    setCurrentTime(13.7);
    await coordinator.start(createRequest(createPattern("snare")), {
      handoff: true,
      originTime: 14,
    });

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      atTime: 14,
    });
    expect(schedulers[0]?.stop).not.toHaveBeenCalled();

    setCurrentTime(14.1);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(cancelPlaybackGroup).toHaveBeenCalledTimes(1);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 14,
      playing: true,
    });
  });

  it("restores active group automation when a pending handoff is cancelled", async () => {
    vi.useFakeTimers();
    const {
      cancelPlaybackGroup,
      clearPlaybackGroupCancellation,
      coordinator,
      setCurrentTime,
    } = createHarness();

    await coordinator.start(createRequest(createPattern("kick")));
    setCurrentTime(13.7);
    await coordinator.start(createRequest(createPattern("snare")), {
      handoff: true,
      originTime: 14,
    });
    coordinator.cancelPendingStart();

    expect(clearPlaybackGroupCancellation).toHaveBeenCalledWith("group-0");
    expect(cancelPlaybackGroup).toHaveBeenLastCalledWith("group-1");
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      playing: true,
    });
    expect(coordinator.getSnapshot().pendingId).toBeUndefined();
  });

  it("commits a handoff that already crossed its audio boundary", async () => {
    vi.useFakeTimers();
    const {
      cancelPlaybackGroup,
      clearPlaybackGroupCancellation,
      coordinator,
      setCurrentTime,
    } = createHarness();

    await coordinator.start(createRequest(createPattern("kick")));
    setCurrentTime(13.7);
    await coordinator.start(createRequest(createPattern("snare")), {
      handoff: true,
      originTime: 14,
    });
    setCurrentTime(14.1);
    coordinator.cancelPendingStart();

    expect(clearPlaybackGroupCancellation).not.toHaveBeenCalled();
    expect(cancelPlaybackGroup).toHaveBeenCalledTimes(1);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 14,
      playing: true,
    });
    expect(coordinator.getSnapshot().pendingId).toBeUndefined();
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
