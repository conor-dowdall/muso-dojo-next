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
    sessionId: "session",
    signature: "60:content",
    sourceSignature: "source",
    tempoBpm: 60,
    parts: [
      {
        durationBeats: 4,
        index: 0,
        partId: "part-a",
        rhythmRequest: {
          id: "rhythm-a",
          pattern: createRhythmPattern(),
          tempoBpm: 60,
        },
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
  const manualStartListeners = new Set<() => void>();
  const stopPartPlayback = vi.fn();
  const transport = {
    getCurrentTime: () => 10 + Date.now() / 1000,
    startPart,
    stopPartPlayback,
    subscribeToManualStart: (listener: () => void) => {
      manualStartListeners.add(listener);
      return () => manualStartListeners.delete(listener);
    },
  } as unknown as BeatTransportCoordinator;
  const coordinator = new PartSequenceCoordinator(transport);

  return {
    coordinator,
    manualStart: () => manualStartListeners.forEach((listener) => listener()),
    startPart,
    stopPartPlayback,
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

  it("ignores stale starts after the sequence is stopped", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const deferred = createDeferred<{ originTime: number; started: boolean }>();
    const transport = {
      getCurrentTime: () => 10,
      startPart: vi.fn(() => deferred.promise),
      stopPartPlayback: vi.fn(),
      subscribeToManualStart: () => () => undefined,
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
});
