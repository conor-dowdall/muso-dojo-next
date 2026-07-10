import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExercisePlaybackCoordinator,
  exercisePlaybackRestartRequestsAreEqual,
  isExercisePlaybackActive,
  type ExercisePlaybackAudioEngine,
  type ExerciseMetronomeSchedulerFactory,
  type ExercisePlaybackRequest,
  type ExerciseSchedulerFactory,
} from "@/audio/exercisePlaybackCoordinator";
import { type PlaybackGroupHandle } from "@/audio/types";

function createRequest(id: string, midi: number): ExercisePlaybackRequest {
  return {
    countInBeats: 0,
    events: [
      {
        durationBeats: 1,
        midi,
        offsetBeats: 0,
        stepIndex: 0,
      },
    ],
    id,
    metronomeEnabled: false,
    presetId: "piano",
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

describe("exercisePlaybackRestartRequestsAreEqual", () => {
  it("treats rebuilt requests with the same musical contents as equal", () => {
    const request = createRequest("looper", 60);
    const rebuiltRequest = {
      ...request,
      events: request.events.map((event) => ({ ...event })),
    };

    expect(rebuiltRequest).not.toBe(request);
    expect(rebuiltRequest.events).not.toBe(request.events);
    expect(
      exercisePlaybackRestartRequestsAreEqual(request, rebuiltRequest),
    ).toBe(true);
  });

  it("ignores one-shot and live playback control differences", () => {
    const request = createRequest("looper", 60);
    const changedRequests: ExercisePlaybackRequest[] = [
      { ...request, countInBeats: 4 },
      { ...request, metronomeEnabled: true },
    ];

    changedRequests.forEach((changedRequest) => {
      expect(
        exercisePlaybackRestartRequestsAreEqual(request, changedRequest),
      ).toBe(true);
    });
  });

  it("detects changes to ongoing playback request fields", () => {
    const request = createRequest("looper", 60);
    const event = request.events[0]!;
    const changedRequests: ExercisePlaybackRequest[] = [
      { ...request, id: "other-looper" },
      { ...request, presetId: "bowed-strings" },
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
      expect(
        exercisePlaybackRestartRequestsAreEqual(request, changedRequest),
      ).toBe(false);
    });
  });
});

describe("ExercisePlaybackCoordinator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats pending playback as active only for the matching looper", () => {
    const snapshot = {
      events: [],
      pendingId: "pending-looper",
      playing: false,
    };

    expect(isExercisePlaybackActive(snapshot, "pending-looper")).toBe(true);
    expect(isExercisePlaybackActive(snapshot, "other-looper")).toBe(false);
  });

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
      scheduleMetronomeClick: vi.fn(),
      scheduleNote: vi.fn(),
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
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", undefined);
    expect(schedulers[1]?.start).toHaveBeenCalledWith(10.28);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "looper",
      originTime: 10.28,
      playing: true,
    });
  });

  it("arms a handoff on the audio clock before the commit timer can be delayed", async () => {
    vi.useFakeTimers();
    let currentTime = 10;
    let nextGroupId = 0;
    const cancelPlaybackGroup = vi.fn();
    const schedulers: Array<{
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }> = [];
    const coordinator = new ExercisePlaybackCoordinator(
      {
        cancelPlaybackGroup,
        createPlaybackGroup: () =>
          `group-${nextGroupId++}` as PlaybackGroupHandle,
        getCurrentTime: () => currentTime,
        prime: async () => true,
        scheduleMetronomeClick: vi.fn(),
        scheduleNote: vi.fn(),
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
    currentTime = 13.7;
    await coordinator.start(createRequest("next-looper", 62), {
      handoff: true,
      originTime: 14,
    });

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      atTime: 14,
      releaseSeconds: 0.08,
    });
    expect(schedulers[0]?.stop).not.toHaveBeenCalled();

    currentTime = 14.1;
    await vi.advanceTimersByTimeAsync(1_000);

    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(cancelPlaybackGroup).toHaveBeenCalledTimes(1);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "next-looper",
      originTime: 14,
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
        scheduleMetronomeClick: vi.fn(),
        scheduleNote: vi.fn(),
        subscribeToStopAll: () => () => undefined,
      },
      createScheduler,
    );
    const start = coordinator.start(createRequest("looper", 60));

    expect(coordinator.getSnapshot()).toMatchObject({
      pendingId: "looper",
      playing: false,
    });

    coordinator.stop("looper");
    expect(coordinator.getSnapshot()).toEqual({
      events: [],
      playing: false,
    });
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
        scheduleMetronomeClick: vi.fn(),
        scheduleNote: vi.fn(),
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
    expect(coordinator.getSnapshot()).toEqual({
      events: [],
      pendingId: "second-looper",
      pendingOwner: "manual",
      playing: false,
    });
    nextPrimeResult.resolve(true);

    await expect(nextStart).resolves.toBe(true);
    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(schedulers[1]?.start).toHaveBeenCalledWith(10.08);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "second-looper",
      playing: true,
    });
  });

  it("schedules an accented count-in before the exercise origin", async () => {
    const scheduleMetronomeClick = vi.fn();
    const schedulerStart = vi.fn();
    let nextGroupId = 0;
    const coordinator = new ExercisePlaybackCoordinator(
      {
        cancelPlaybackGroup: vi.fn(),
        createPlaybackGroup: () =>
          `group-${nextGroupId++}` as PlaybackGroupHandle,
        getCurrentTime: () => 10,
        prime: async () => true,
        scheduleMetronomeClick,
        scheduleNote: vi.fn(),
        subscribeToStopAll: () => () => undefined,
      },
      () => ({
        isRunning: () => true,
        start: schedulerStart,
        stop: vi.fn(),
      }),
    );

    await coordinator.start({
      ...createRequest("looper", 60),
      countInBeats: 4,
      tempoBpm: 60,
    });

    expect(scheduleMetronomeClick.mock.calls).toEqual([
      [{ accent: true, group: "group-0", startTime: 10.08 }],
      [{ accent: false, group: "group-0", startTime: 11.08 }],
      [{ accent: false, group: "group-0", startTime: 12.08 }],
      [{ accent: false, group: "group-0", startTime: 13.08 }],
    ]);
    expect(schedulerStart).toHaveBeenCalledWith(14.08);
    expect(coordinator.getSnapshot()).toMatchObject({
      countInBeats: 4,
      countInStartTime: 10.08,
      originTime: 14.08,
      playing: true,
    });
  });

  it("schedules unaccented quarter-note clicks from the exercise origin", async () => {
    const cancelPlaybackGroup = vi.fn();
    const scheduleMetronomeClick = vi.fn();
    const metronomeStart = vi.fn();
    const metronomeStop = vi.fn();
    let nextGroupId = 0;
    const createMetronomeScheduler = vi.fn<ExerciseMetronomeSchedulerFactory>(
      () => ({
        isRunning: () => true,
        start: metronomeStart,
        stop: metronomeStop,
      }),
    );
    const coordinator = new ExercisePlaybackCoordinator(
      {
        cancelPlaybackGroup,
        createPlaybackGroup: () =>
          `group-${nextGroupId++}` as PlaybackGroupHandle,
        getCurrentTime: () => 10,
        prime: async () => true,
        scheduleMetronomeClick,
        scheduleNote: vi.fn(),
        subscribeToStopAll: () => () => undefined,
      },
      () => ({
        isRunning: () => true,
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createMetronomeScheduler,
    );

    await coordinator.start({
      ...createRequest("looper", 60),
      countInBeats: 2,
      metronomeEnabled: true,
      tempoBpm: 120,
    });

    expect(createMetronomeScheduler).toHaveBeenCalledOnce();
    const options = createMetronomeScheduler.mock.calls[0]?.[0];
    expect(options?.events).toEqual([
      { duration: 0.5, offset: 0, payload: true },
    ]);
    options?.onSchedule(options.events[0]!, 11.08, 0, 0);
    expect(scheduleMetronomeClick).toHaveBeenLastCalledWith({
      accent: false,
      group: "group-2",
      startTime: 11.08,
    });
    expect(metronomeStart).toHaveBeenCalledWith(11.08);

    coordinator.stop("looper");
    expect(metronomeStop).toHaveBeenCalledOnce();
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0", {
      releaseSeconds: 0.08,
    });
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-2", {
      releaseSeconds: 0.08,
    });
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-1", {
      releaseSeconds: 0.08,
    });
  });

  it("toggles the metronome without restarting exercise notes", async () => {
    let currentTime = 10;
    let nextGroupId = 0;
    const cancelPlaybackGroup = vi.fn();
    const noteScheduler = {
      isRunning: () => true,
      start: vi.fn(),
      stop: vi.fn(),
    };
    const metronomeScheduler = {
      isRunning: () => true,
      start: vi.fn(),
      stop: vi.fn(),
    };
    const createMetronomeScheduler = vi.fn<ExerciseMetronomeSchedulerFactory>(
      () => metronomeScheduler,
    );
    const coordinator = new ExercisePlaybackCoordinator(
      {
        cancelPlaybackGroup,
        createPlaybackGroup: () =>
          `group-${nextGroupId++}` as PlaybackGroupHandle,
        getCurrentTime: () => currentTime,
        prime: async () => true,
        scheduleMetronomeClick: vi.fn(),
        scheduleNote: vi.fn(),
        subscribeToStopAll: () => () => undefined,
      },
      () => noteScheduler,
      createMetronomeScheduler,
    );

    await coordinator.start(createRequest("looper", 60));
    currentTime = 11;

    expect(coordinator.setMetronomeEnabled("looper", true)).toBe(true);

    expect(noteScheduler.stop).not.toHaveBeenCalled();
    expect(metronomeScheduler.start).toHaveBeenCalledWith(10.08);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "looper",
      originTime: 10.08,
      playing: true,
    });

    expect(coordinator.setMetronomeEnabled("looper", false)).toBe(true);

    expect(noteScheduler.stop).not.toHaveBeenCalled();
    expect(metronomeScheduler.stop).toHaveBeenCalledOnce();
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-1", undefined);
  });
});
