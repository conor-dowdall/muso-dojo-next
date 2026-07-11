import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExercisePlaybackCoordinator,
  isExercisePlaybackActive,
  type ExercisePlaybackAudioEngine,
  type ExercisePlaybackRequest,
} from "@/audio/exercisePlaybackCoordinator";
import { type LookaheadScheduler } from "@/audio/lookaheadScheduler";
import { type PlaybackGroupHandle } from "@/audio/types";

function createRequest(
  id: string,
  settings: Partial<ExercisePlaybackRequest> = {},
): ExercisePlaybackRequest {
  return {
    countInBeats: 0,
    events: [
      {
        durationBeats: 1,
        midi: 60,
        offsetBeats: 0,
        stepIndex: 0,
      },
    ],
    id,
    metronomeEnabled: false,
    presetId: "piano",
    tempoBpm: 60,
    ...settings,
  };
}

function createScheduler() {
  return {
    isRunning: vi.fn(() => true),
    start: vi.fn(),
    stop: vi.fn(),
  } satisfies LookaheadScheduler;
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function createHarness(prime: () => Promise<boolean> = async () => true) {
  let currentTime = 10;
  let groupIndex = 0;
  let stopAllListener: () => void = () => undefined;
  const cancelPlaybackGroup = vi.fn();
  const noteSchedulers: LookaheadScheduler[] = [];
  const metronomeSchedulers: LookaheadScheduler[] = [];
  const audioEngine: ExercisePlaybackAudioEngine = {
    cancelPlaybackGroup,
    createPlaybackGroup: () => `group-${groupIndex++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime,
    scheduleMetronomeClick: vi.fn(() => true),
    scheduleNote: vi.fn(),
    subscribeToStopAll: (listener) => {
      stopAllListener = listener;
      return () => undefined;
    },
  };
  const coordinator = new ExercisePlaybackCoordinator(
    audioEngine,
    () => {
      const scheduler = createScheduler();
      noteSchedulers.push(scheduler);
      return scheduler;
    },
    () => {
      const scheduler = createScheduler();
      metronomeSchedulers.push(scheduler);
      return scheduler;
    },
  );

  return {
    cancelPlaybackGroup,
    coordinator,
    metronomeSchedulers,
    noteSchedulers,
    setCurrentTime: (value: number) => {
      currentTime = value;
    },
    stopAll: () => stopAllListener(),
  };
}

describe("ExercisePlaybackCoordinator", () => {
  afterEach(() => vi.useRealTimers());

  it("treats pending playback as active only for the matching Looper", () => {
    const snapshot = {
      events: [],
      pendingId: "pending",
      pendingIds: ["pending"],
      playbacks: {},
      playing: false,
    };

    expect(isExercisePlaybackActive(snapshot, "pending")).toBe(true);
    expect(isExercisePlaybackActive(snapshot, "other")).toBe(false);
  });

  it("retires the previous Looper when another starts", async () => {
    vi.useFakeTimers();
    const { cancelPlaybackGroup, coordinator, noteSchedulers } =
      createHarness();

    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      atTime: 10.08,
      releaseSeconds: 0.08,
    });
    expect(noteSchedulers[0]?.stop).not.toHaveBeenCalled();
    expect(noteSchedulers[1]?.start).toHaveBeenCalledWith(10.08);

    await vi.advanceTimersByTimeAsync(100);
    expect(Object.keys(coordinator.getSnapshot().playbacks)).toEqual(["b"]);
    expect(noteSchedulers[0]?.stop).toHaveBeenCalledOnce();
  });

  it("does not let a stale stop affect the current Looper", async () => {
    vi.useFakeTimers();
    const { coordinator } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));
    await vi.advanceTimersByTimeAsync(100);

    coordinator.stop("a");

    expect(coordinator.getSnapshot().playbacks.a).toBeUndefined();
    expect(coordinator.getSnapshot().playbacks.b).toBeDefined();
  });

  it("replaces the current request when the same Looper restarts", async () => {
    vi.useFakeTimers();
    const { cancelPlaybackGroup, coordinator } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("a", { presetId: "bowed-strings" }));

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      atTime: 10.08,
      releaseSeconds: 0.08,
    });
    expect(coordinator.getActiveRequest("a")?.presetId).toBe("bowed-strings");
  });

  it("stops the previous Looper when a replacement count-in begins", async () => {
    const { cancelPlaybackGroup, coordinator } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b", { countInBeats: 4 }));

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      atTime: 10.08,
      releaseSeconds: 0.08,
    });
    expect(coordinator.getSnapshot().playbacks.b?.originTime).toBe(14.08);
  });

  it("cancels a pending Looper when a newer Looper starts", async () => {
    const ready = createDeferred<boolean>();
    const { coordinator } = createHarness(() => ready.promise);
    const first = coordinator.start(createRequest("first"));
    const second = coordinator.start(createRequest("second"));

    ready.resolve(true);

    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
    expect(coordinator.getSnapshot().pendingIds).toEqual([]);
    expect(coordinator.getSnapshot().playbacks.second).toBeDefined();
  });

  it("schedules a precise future stop on the audio clock", async () => {
    vi.useFakeTimers();
    const { cancelPlaybackGroup, coordinator, noteSchedulers } =
      createHarness();
    await coordinator.start(createRequest("a"));

    coordinator.stop("a", { atTime: 12 });
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", { atTime: 12 });
    expect(noteSchedulers[0]?.stop).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(noteSchedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(coordinator.getSnapshot().playbacks.a).toBeUndefined();
  });

  it("hands the metronome lane to the replacement Looper", async () => {
    vi.useFakeTimers();
    const { coordinator, metronomeSchedulers } = createHarness();
    await coordinator.start(createRequest("a", { metronomeEnabled: true }));
    await coordinator.start(createRequest("b", { metronomeEnabled: true }));

    expect(metronomeSchedulers).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(metronomeSchedulers).toHaveLength(2);
    expect(metronomeSchedulers[1]?.start).toHaveBeenCalledWith(10.08);
  });

  it("resets every active Looper when the engine stops all audio", async () => {
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
