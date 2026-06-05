import { describe, expect, it, vi } from "vitest";
import {
  createDroneNotePlaybackController,
  getDronePlaybackVelocity,
} from "@/hooks/audio/useDroneNotePlayback";

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

describe("createDroneNotePlaybackController", () => {
  it("keeps a note sounding until the same interval is toggled off", async () => {
    const activeIntervals: number[][] = [];
    const stop = vi.fn();
    const controller = createDroneNotePlaybackController({
      onActiveIntervalsChange: (intervals) => activeIntervals.push(intervals),
      start: vi.fn(async (note) => `handle-${note.interval}`),
      stop,
    });

    await controller.startNote({ interval: 0, midi: 48 });
    controller.toggleNote({ interval: 0, midi: 48 });

    expect(activeIntervals).toStrictEqual([[0], []]);
    expect(stop).toHaveBeenCalledWith("handle-0");
  });

  it("stops a late handle after a note is toggled off while starting", async () => {
    const deferred = createDeferred<string | undefined>();
    const stop = vi.fn();
    const controller = createDroneNotePlaybackController({
      start: vi.fn(() => deferred.promise),
      stop,
    });

    const startPromise = controller.startNote({ interval: 7, midi: 55 });
    controller.stopNote(7);
    deferred.resolve("late-handle");
    await startPromise;

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(stop).toHaveBeenCalledWith("late-handle");
  });

  it("stops all active drone notes at once", async () => {
    const activeIntervals: number[][] = [];
    const stop = vi.fn();
    const controller = createDroneNotePlaybackController({
      onActiveIntervalsChange: (intervals) => activeIntervals.push(intervals),
      start: vi.fn(async (note) => `handle-${note.interval}`),
      stop,
    });

    await controller.startNote({ interval: 0, midi: 48 });
    await controller.startNote({ interval: 7, midi: 55 });
    controller.stopAll();

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(activeIntervals).toStrictEqual([[0], [0, 7], []]);
    expect(stop).toHaveBeenCalledWith("handle-0");
    expect(stop).toHaveBeenCalledWith("handle-7");
  });

  it("restarts an active interval when its sounding midi changes", async () => {
    let handleIndex = 0;
    const stop = vi.fn();
    const controller = createDroneNotePlaybackController({
      start: vi.fn(async () => `handle-${++handleIndex}`),
      stop,
    });

    await controller.startNote({ interval: 0, midi: 48 });
    controller.reconcileNotes([{ interval: 0, midi: 50 }]);
    await Promise.resolve();

    expect(controller.getActiveIntervals()).toStrictEqual([0]);
    expect(stop).toHaveBeenCalledWith("handle-1");
  });

  it("restarts an active interval when its playback sound changes", async () => {
    let handleIndex = 0;
    const stop = vi.fn();
    const start = vi.fn(async () => `handle-${++handleIndex}`);
    const controller = createDroneNotePlaybackController({
      start,
      stop,
    });

    await controller.startNote({
      audioPresetId: "soft-organ",
      interval: 0,
      midi: 48,
      velocity: 0.78,
    });
    controller.reconcileNotes([
      {
        audioPresetId: "warm-pad",
        interval: 0,
        midi: 48,
        velocity: 0.78,
      },
    ]);
    await Promise.resolve();

    expect(controller.getActiveIntervals()).toStrictEqual([0]);
    expect(stop).toHaveBeenCalledWith("handle-1");
    expect(start).toHaveBeenLastCalledWith({
      audioPresetId: "warm-pad",
      interval: 0,
      midi: 48,
      velocity: 0.78,
    });
  });

  it("restarts an active interval when its balanced velocity changes", async () => {
    let handleIndex = 0;
    const stop = vi.fn();
    const start = vi.fn(async () => `handle-${++handleIndex}`);
    const controller = createDroneNotePlaybackController({
      start,
      stop,
    });

    await controller.startNote({ interval: 0, midi: 48, velocity: 0.78 });
    controller.reconcileNotes([{ interval: 0, midi: 48, velocity: 0.62 }]);
    await Promise.resolve();

    expect(controller.getActiveIntervals()).toStrictEqual([0]);
    expect(stop).toHaveBeenCalledWith("handle-1");
    expect(start).toHaveBeenLastCalledWith({
      interval: 0,
      midi: 48,
      velocity: 0.62,
    });
  });

  it("stops active notes that leave the available note row", async () => {
    const stop = vi.fn();
    const controller = createDroneNotePlaybackController({
      start: vi.fn(async (note) => `handle-${note.interval}`),
      stop,
    });

    await controller.startNote({ interval: 14, midi: 62 });
    controller.reconcileNotes([{ interval: 0, midi: 48 }]);

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(stop).toHaveBeenCalledWith("handle-14");
  });
});

describe("getDronePlaybackVelocity", () => {
  it("keeps the root strongest and lowers pitches above it", () => {
    const root = getDronePlaybackVelocity({ interval: 0 });
    const third = getDronePlaybackVelocity({ interval: 4 });
    const fifth = getDronePlaybackVelocity({ interval: 7 });
    const octave = getDronePlaybackVelocity({ interval: 12 });
    const doubleOctave = getDronePlaybackVelocity({
      interval: 24,
    });

    expect(root).toBeCloseTo(0.78);
    expect(third).toBeLessThan(root);
    expect(fifth).toBeLessThan(third);
    expect(octave).toBeLessThan(fifth);
    expect(doubleOctave).toBeLessThan(octave);
  });
});
