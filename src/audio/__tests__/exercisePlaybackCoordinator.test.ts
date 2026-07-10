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

  it("keeps independently started Loopers active together", async () => {
    const { coordinator, noteSchedulers } = createHarness();

    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    expect(Object.keys(coordinator.getSnapshot().playbacks)).toEqual([
      "a",
      "b",
    ]);
    expect(noteSchedulers[0]?.stop).not.toHaveBeenCalled();
    expect(noteSchedulers[1]?.start).toHaveBeenCalledWith(10.08);
  });

  it("stops only the requested Looper", async () => {
    const { coordinator, noteSchedulers } = createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));

    coordinator.stop("a");

    expect(coordinator.getSnapshot().playbacks.a).toBeUndefined();
    expect(coordinator.getSnapshot().playbacks.b).toBeDefined();
    expect(noteSchedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(noteSchedulers[1]?.stop).not.toHaveBeenCalled();
  });

  it("restarts only the same Looper ID when its request changes", async () => {
    const { cancelPlaybackGroup, coordinator, noteSchedulers } =
      createHarness();
    await coordinator.start(createRequest("a"));
    await coordinator.start(createRequest("b"));
    await coordinator.start(createRequest("a", { presetId: "bowed-strings" }));

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      releaseSeconds: 0.08,
    });
    expect(noteSchedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(noteSchedulers[1]?.stop).not.toHaveBeenCalled();
    expect(coordinator.getActiveRequest("a")?.presetId).toBe("bowed-strings");
  });

  it("cancels a pending start without affecting another active Looper", async () => {
    const ready = createDeferred<boolean>();
    const { coordinator } = createHarness(() => ready.promise);
    const pending = coordinator.start(createRequest("pending"));

    coordinator.cancelPendingStart("pending");
    ready.resolve(true);

    await expect(pending).resolves.toBe(false);
    expect(coordinator.getSnapshot().pendingIds).toEqual([]);
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

  it("uses one metronome lane for multiple requesting Loopers", async () => {
    const { coordinator, metronomeSchedulers } = createHarness();
    await coordinator.start(createRequest("a", { metronomeEnabled: true }));
    await coordinator.start(createRequest("b", { metronomeEnabled: true }));

    expect(metronomeSchedulers).toHaveLength(1);
    coordinator.stop("a");
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
