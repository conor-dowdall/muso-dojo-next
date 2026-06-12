import { describe, expect, it, vi } from "vitest";
import {
  ExercisePlaybackCoordinator,
  exercisePlaybackRequestsAreEqual,
  type ExercisePlaybackAudioEngine,
  type ExercisePlaybackRequest,
  type ExerciseSchedulerFactory,
} from "@/audio/exercisePlaybackCoordinator";
import { type PlaybackGroupHandle } from "@/audio/types";

function createRequest(id: string, midi: number): ExercisePlaybackRequest {
  return {
    events: [
      {
        durationBeats: 1,
        midi,
        offsetBeats: 0,
        stepIndex: 0,
      },
    ],
    id,
    presetId: "reference-tone",
    tempoBpm: 60,
  };
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

describe("exercisePlaybackRequestsAreEqual", () => {
  it("treats rebuilt requests with the same musical contents as equal", () => {
    const request = createRequest("looper", 60);
    const rebuiltRequest = {
      ...request,
      events: request.events.map((event) => ({ ...event })),
    };

    expect(rebuiltRequest).not.toBe(request);
    expect(rebuiltRequest.events).not.toBe(request.events);
    expect(exercisePlaybackRequestsAreEqual(request, rebuiltRequest)).toBe(
      true,
    );
  });

  it("detects changes to every scheduler-relevant request field", () => {
    const request = createRequest("looper", 60);
    const event = request.events[0]!;
    const changedRequests: ExercisePlaybackRequest[] = [
      { ...request, id: "other-looper" },
      { ...request, presetId: "warm-pad" },
      { ...request, tempoBpm: 90 },
      { ...request, events: [] },
      {
        ...request,
        events: [{ ...event, durationBeats: 2 }],
      },
      {
        ...request,
        events: [{ ...event, midi: 62 }],
      },
      {
        ...request,
        events: [{ ...event, offsetBeats: 1 }],
      },
      {
        ...request,
        events: [{ ...event, stepIndex: 1 }],
      },
    ];

    changedRequests.forEach((changedRequest) => {
      expect(exercisePlaybackRequestsAreEqual(request, changedRequest)).toBe(
        false,
      );
    });
  });
});

describe("ExercisePlaybackCoordinator", () => {
  it("restarts changed playback from a fresh origin instead of the old beat grid", async () => {
    let currentTime = 10;
    let nextGroupId = 0;
    const cancelPlaybackGroup = vi.fn();
    const audioEngine: ExercisePlaybackAudioEngine = {
      cancelPlaybackGroup,
      createPlaybackGroup: () =>
        `group-${nextGroupId++}` as PlaybackGroupHandle,
      getCurrentTime: () => currentTime,
      prime: async () => true,
      scheduleNote: vi.fn(),
      subscribeToReset: () => () => undefined,
      subscribeToStopAll: () => () => undefined,
    };
    const schedulers: Array<{
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }> = [];
    const createScheduler: ExerciseSchedulerFactory = () => {
      const scheduler = {
        isRunning: () => true,
        start: vi.fn(),
        stop: vi.fn(),
      };
      schedulers.push(scheduler);
      return scheduler;
    };
    const coordinator = new ExercisePlaybackCoordinator(
      audioEngine,
      createScheduler,
    );

    await coordinator.start(createRequest("looper", 60));

    expect(schedulers[0]?.start).toHaveBeenCalledWith(10.08);

    currentTime = 10.2;
    await coordinator.start(createRequest("looper", 62));

    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");
    expect(schedulers[1]?.start).toHaveBeenCalledWith(10.28);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "looper",
      originTime: 10.28,
      playing: true,
    });
  });

  it("cancels a pending start when stopped during audio priming", async () => {
    const primeResult = createDeferred<boolean>();
    const createScheduler = vi.fn<ExerciseSchedulerFactory>();
    const coordinator = new ExercisePlaybackCoordinator(
      {
        cancelPlaybackGroup: vi.fn(),
        createPlaybackGroup: vi.fn(),
        getCurrentTime: () => 10,
        prime: () => primeResult.promise,
        scheduleNote: vi.fn(),
        subscribeToReset: () => () => undefined,
        subscribeToStopAll: () => () => undefined,
      },
      createScheduler,
    );
    const start = coordinator.start(createRequest("looper", 60));

    coordinator.stop("looper");
    primeResult.resolve(true);

    await expect(start).resolves.toBe(false);
    expect(createScheduler).not.toHaveBeenCalled();
    expect(coordinator.getSnapshot().playing).toBe(false);
  });

  it("does not cancel another looper's pending start when stopping the active one", async () => {
    const nextPrimeResult = createDeferred<boolean>();
    const prime = vi
      .fn<ExercisePlaybackAudioEngine["prime"]>()
      .mockResolvedValueOnce(true)
      .mockReturnValueOnce(nextPrimeResult.promise);
    let nextGroupId = 0;
    const schedulers: Array<{
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }> = [];
    const coordinator = new ExercisePlaybackCoordinator(
      {
        cancelPlaybackGroup: vi.fn(),
        createPlaybackGroup: () =>
          `group-${nextGroupId++}` as PlaybackGroupHandle,
        getCurrentTime: () => 10,
        prime,
        scheduleNote: vi.fn(),
        subscribeToReset: () => () => undefined,
        subscribeToStopAll: () => () => undefined,
      },
      () => {
        const scheduler = {
          isRunning: () => true,
          start: vi.fn(),
          stop: vi.fn(),
        };
        schedulers.push(scheduler);
        return scheduler;
      },
    );

    await coordinator.start(createRequest("first-looper", 60));
    const nextStart = coordinator.start(createRequest("second-looper", 62));

    coordinator.stop("first-looper");
    nextPrimeResult.resolve(true);

    await expect(nextStart).resolves.toBe(true);
    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(schedulers[1]?.start).toHaveBeenCalledWith(10.08);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "second-looper",
      playing: true,
    });
  });
});
