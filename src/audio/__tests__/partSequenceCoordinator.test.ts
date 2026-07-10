import { afterEach, describe, expect, it, vi } from "vitest";
import { PartSequenceCoordinator } from "@/audio/partSequenceCoordinator";
import { RHYTHM_PPQ, type RhythmPattern } from "@/data/rhythmPresets";
import { type BeatTransportCoordinator } from "@/audio/beatTransportCoordinator";
import { type PartSequencePlaybackPlan } from "@/audio/partSequencePlanning";

function createRhythmPattern(): RhythmPattern {
  return {
    cycleTicks: RHYTHM_PPQ * 4,
    hits: [{ atTicks: 0, sampleId: "kick" }],
    meter: { beats: 4, beatUnit: 4 },
    ppq: RHYTHM_PPQ,
  };
}

function createPlan(): PartSequencePlaybackPlan {
  return {
    contentSignature: "content",
    partResetSignatures: ["part-a-reset", "part-b-reset"],
    sessionId: "session",
    signature: "60:content",
    sourceSignature: "source",
    tempoBpm: 60,
    updateSignature: "60:update",
    parts: [
      {
        durationBeats: 4,
        index: 0,
        partId: "part-a",
        resetSignature: "part-a-reset",
        rhythmRequest: {
          id: "rhythm-a",
          pattern: createRhythmPattern(),
          tempoBpm: 60,
        },
        updateSignature: "part-a-update",
      },
      {
        durationBeats: 2,
        exerciseRequest: {
          countInBeats: 0,
          events: [
            {
              durationBeats: 1,
              midi: 60,
              offsetBeats: 0,
              stepIndex: 0,
            },
          ],
          id: "exercise-b",
          metronomeEnabled: false,
          presetId: "piano",
          tempoBpm: 60,
        },
        index: 1,
        partId: "part-b",
        resetSignature: "part-b-reset",
        updateSignature: "part-b-update",
      },
    ],
  };
}

function createSplitBarPlan(): PartSequencePlaybackPlan {
  return {
    ...createPlan(),
    contentSignature: "split-content",
    partResetSignatures: ["split-a-reset", "split-b-reset"],
    signature: "60:split-content",
    updateSignature: "60:split-update",
    parts: [
      {
        durationBeats: 2,
        exerciseRequest: {
          countInBeats: 0,
          events: [
            {
              durationBeats: 1,
              midi: 60,
              offsetBeats: 0,
              stepIndex: 0,
            },
          ],
          id: "exercise-a",
          metronomeEnabled: false,
          presetId: "piano",
          tempoBpm: 60,
        },
        index: 0,
        partId: "part-a",
        resetSignature: "split-a-reset",
        rhythmRequest: {
          id: "rhythm-a",
          pattern: createRhythmPattern(),
          tempoBpm: 60,
        },
        updateSignature: "split-a-update",
      },
      {
        durationBeats: 2,
        exerciseRequest: {
          countInBeats: 0,
          events: [
            {
              durationBeats: 1,
              midi: 67,
              offsetBeats: 0,
              stepIndex: 0,
            },
          ],
          id: "exercise-b",
          metronomeEnabled: false,
          presetId: "piano",
          tempoBpm: 60,
        },
        index: 1,
        partId: "part-b",
        resetSignature: "split-b-reset",
        rhythmRequest: {
          id: "rhythm-b",
          pattern: createRhythmPattern(),
          tempoBpm: 60,
        },
        updateSignature: "split-b-update",
      },
    ],
  };
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function createHarness() {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  const startPart = vi.fn(
    async (request: Parameters<BeatTransportCoordinator["startPart"]>[0]) => ({
      originTime: request.originTime ?? 10 + Date.now() / 1000 + 0.08,
      started: true,
    }),
  );
  const manualStartListeners = new Set<
    (event: { kind: "start" | "stop" }) => void
  >();
  const stopPartPlayback = vi.fn();
  const updatePartLive = vi.fn();
  const transport = {
    getCurrentTime: () => 10 + Date.now() / 1000,
    startPart,
    stopPartPlayback,
    subscribeToManualControl: (listener: () => void) => {
      manualStartListeners.add(listener);
      return () => manualStartListeners.delete(listener);
    },
    updatePartLive,
  } as unknown as BeatTransportCoordinator;
  const coordinator = new PartSequenceCoordinator(transport);

  return {
    coordinator,
    manualStart: () =>
      manualStartListeners.forEach((listener) => listener({ kind: "start" })),
    manualStop: () =>
      manualStartListeners.forEach((listener) => listener({ kind: "stop" })),
    startPart,
    stopPartPlayback,
    updatePartLive,
  };
}

describe("PartSequenceCoordinator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts the first part and hands off to the next part on the boundary", async () => {
    const { coordinator, startPart } = createHarness();

    await coordinator.start(createPlan());

    expect(coordinator.getSnapshot()).toMatchObject({
      activeIndex: 0,
      activePartId: "part-a",
      originTime: 10.08,
      playing: true,
    });
    expect(startPart).toHaveBeenCalledWith(
      expect.objectContaining({
        rhythm: expect.objectContaining({ id: "rhythm-a" }),
        source: "part-sequence",
      }),
    );

    await vi.advanceTimersByTimeAsync(4000);

    expect(coordinator.getSnapshot()).toMatchObject({
      activeIndex: 0,
      pendingIndex: 1,
      pendingPartId: "part-b",
      playing: true,
    });
    expect(startPart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        exercise: expect.objectContaining({ id: "exercise-b" }),
        handoff: true,
        originTime: 14.08,
        rhythm: undefined,
        stopMissing: true,
      }),
    );

    await vi.advanceTimersByTimeAsync(80);

    expect(coordinator.getSnapshot()).toMatchObject({
      activeIndex: 1,
      activePartId: "part-b",
      playing: true,
    });
    expect(coordinator.getSnapshot().pendingPartId).toBeUndefined();
  });

  it("wraps from the last part back to the first part", async () => {
    const { coordinator, startPart } = createHarness();

    await coordinator.start(createPlan());
    await vi.advanceTimersByTimeAsync(4080);
    await vi.advanceTimersByTimeAsync(2000);

    expect(startPart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        handoff: true,
        originTime: 16.08,
        rhythm: expect.objectContaining({ id: "rhythm-a" }),
      }),
    );
  });

  it("hands off split progression parts as ordinary visible rhythm parts", async () => {
    const { coordinator, startPart } = createHarness();

    await coordinator.start(createSplitBarPlan());

    expect(startPart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        exercise: expect.objectContaining({ id: "exercise-a" }),
        rhythm: expect.objectContaining({ id: "rhythm-a" }),
        stopMissing: true,
      }),
    );

    await vi.advanceTimersByTimeAsync(2000);

    expect(startPart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        exercise: expect.objectContaining({ id: "exercise-b" }),
        handoff: true,
        originTime: 12.08,
        rhythm: expect.objectContaining({ id: "rhythm-b" }),
        stopMissing: true,
      }),
    );
  });

  it("stops sequence state without stopping playback when manual transport starts", async () => {
    const { coordinator, manualStart, stopPartPlayback } = createHarness();

    await coordinator.start(createPlan());

    manualStart();

    expect(coordinator.getSnapshot()).toEqual({
      partCount: 0,
      playing: false,
    });
    expect(stopPartPlayback).not.toHaveBeenCalled();
  });

  it("stops band playback when a manual module stop takes over", async () => {
    const { coordinator, manualStop, stopPartPlayback } = createHarness();

    await coordinator.start(createPlan());

    manualStop();

    expect(coordinator.getSnapshot()).toEqual({
      partCount: 0,
      playing: false,
    });
    expect(stopPartPlayback).toHaveBeenCalledOnce();
  });

  it("ignores manual module stops when the band is idle", () => {
    const { manualStop, stopPartPlayback } = createHarness();

    manualStop();

    expect(stopPartPlayback).not.toHaveBeenCalled();
  });

  it("updates a continuing plan without restarting the current part", async () => {
    const { coordinator, startPart, updatePartLive } = createHarness();
    const nextPattern = {
      ...createRhythmPattern(),
      hits: [{ atTicks: 0, sampleId: "snare" as const }],
    };
    const nextPlan: PartSequencePlaybackPlan = {
      ...createPlan(),
      updateSignature: "60:update-next",
      parts: [
        {
          ...createPlan().parts[0]!,
          rhythmRequest: {
            id: "rhythm-a",
            pattern: nextPattern,
            tempoBpm: 60,
          },
          updateSignature: "part-a-update-next",
        },
        createPlan().parts[1]!,
      ],
    };

    await coordinator.start(createPlan());
    const updated = coordinator.updatePlan(nextPlan);

    expect(updated).toBe(true);
    expect(startPart).toHaveBeenCalledOnce();
    expect(updatePartLive).toHaveBeenCalledWith(
      expect.objectContaining({
        rhythm: expect.objectContaining({
          id: "rhythm-a",
          pattern: nextPattern,
        }),
      }),
    );

    await vi.advanceTimersByTimeAsync(4000);

    expect(startPart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        handoff: true,
        originTime: 14.08,
      }),
    );
  });

  it("ignores stale starts after the sequence is stopped", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const deferred = createDeferred<{ originTime: number; started: boolean }>();
    const transport = {
      getCurrentTime: () => 10,
      startPart: vi.fn(() => deferred.promise),
      stopPartPlayback: vi.fn(),
      subscribeToManualControl: () => () => undefined,
      updatePartLive: vi.fn(),
    } as unknown as BeatTransportCoordinator;
    const coordinator = new PartSequenceCoordinator(transport);
    const start = coordinator.start(createPlan());

    coordinator.stop({ stopPlayback: false });
    deferred.resolve({ originTime: 10.08, started: true });

    await expect(start).resolves.toBe(false);
    expect(coordinator.getSnapshot()).toEqual({
      partCount: 0,
      playing: false,
    });
  });

  it("stops partial playback when the current Part cannot start atomically", async () => {
    vi.useFakeTimers();
    const stopPartPlayback = vi.fn();
    const transport = {
      getCurrentTime: () => 10,
      startPart: vi.fn(async () => ({ originTime: 10.08, started: false })),
      stopPartPlayback,
      subscribeToManualControl: () => () => undefined,
      updatePartLive: vi.fn(),
    } as unknown as BeatTransportCoordinator;
    const coordinator = new PartSequenceCoordinator(transport);

    await expect(coordinator.start(createPlan())).resolves.toBe(false);

    expect(stopPartPlayback).toHaveBeenCalledOnce();
    expect(coordinator.getSnapshot()).toEqual({
      partCount: 0,
      playing: false,
    });
  });
});
