import { describe, expect, it, vi } from "vitest";
import { createDroneNotePlaybackController } from "@/hooks/audio/useDroneNotePlayback";

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
