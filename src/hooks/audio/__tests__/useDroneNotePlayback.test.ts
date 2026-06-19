import { describe, expect, it, vi } from "vitest";
import {
  createDroneNotePlaybackController,
  getDronePlaybackVelocity,
} from "@/hooks/audio/droneNotePlaybackController";

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function createController() {
  const create = vi.fn(async () => "drone-handle");
  const destroy = vi.fn();
  const update = vi.fn();
  const activeIntervals: number[][] = [];
  const controller = createDroneNotePlaybackController({
    create,
    destroy,
    onActiveIntervalsChange: (intervals) => activeIntervals.push(intervals),
    update,
  });

  return { activeIntervals, controller, create, destroy, update };
}

describe("createDroneNotePlaybackController", () => {
  it("creates one persistent drone and updates it for note toggles", async () => {
    const { activeIntervals, controller, create, update } = createController();

    await controller.startNote({ interval: 0, midi: 48 });
    await controller.startNote({ interval: 7, midi: 55 });
    controller.toggleNote({ interval: 0, midi: 48 });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith([{ interval: 0, midi: 48 }]);
    expect(update).toHaveBeenNthCalledWith(1, "drone-handle", [
      { interval: 0, midi: 48 },
      { interval: 7, midi: 55 },
    ]);
    expect(update).toHaveBeenNthCalledWith(2, "drone-handle", [
      { interval: 7, midi: 55 },
    ]);
    expect(activeIntervals).toStrictEqual([[0], [0, 7], [7]]);
  });

  it("reconciles the latest state after a delayed first handle", async () => {
    const deferred = createDeferred<string | undefined>();
    const update = vi.fn();
    const controller = createDroneNotePlaybackController({
      create: vi.fn(() => deferred.promise),
      destroy: vi.fn(),
      update,
    });

    const startPromise = controller.startNote({ interval: 7, midi: 55 });
    controller.stopNote(7);
    deferred.resolve("drone-handle");
    await startPromise;

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(update).toHaveBeenCalledWith("drone-handle", []);
  });

  it("destroys a delayed handle when disposed before creation finishes", async () => {
    const deferred = createDeferred<string | undefined>();
    const destroy = vi.fn();
    const controller = createDroneNotePlaybackController({
      create: vi.fn(() => deferred.promise),
      destroy,
      update: vi.fn(),
    });

    const startPromise = controller.startNote({ interval: 0, midi: 48 });
    controller.dispose();
    deferred.resolve("drone-handle");
    await startPromise;

    expect(destroy).toHaveBeenCalledWith("drone-handle");
  });

  it("reactivates after a React Strict Mode effect replay", async () => {
    const { controller, create, destroy } = createController();

    controller.activate();
    controller.dispose();
    controller.activate();
    await controller.startNote({ interval: 0, midi: 48 });

    expect(create).toHaveBeenCalledOnce();
    expect(destroy).not.toHaveBeenCalled();
    expect(controller.getActiveIntervals()).toStrictEqual([0]);
  });

  it("rejects a delayed handle from an earlier lifecycle", async () => {
    const firstHandle = createDeferred<string | undefined>();
    const create = vi
      .fn<() => Promise<string | undefined>>()
      .mockReturnValueOnce(firstHandle.promise)
      .mockResolvedValueOnce("current-handle");
    const destroy = vi.fn();
    const controller = createDroneNotePlaybackController({
      create,
      destroy,
      update: vi.fn(),
    });

    const firstStart = controller.startNote({ interval: 0, midi: 48 });
    controller.dispose();
    controller.activate();
    await controller.startNote({ interval: 7, midi: 55 });
    firstHandle.resolve("stale-handle");
    await firstStart;

    expect(create).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenCalledWith("stale-handle");
    expect(destroy).not.toHaveBeenCalledWith("current-handle");
    expect(controller.getActiveIntervals()).toStrictEqual([7]);
  });

  it("recreates the group when an AudioContext reset invalidates its handle", async () => {
    const create = vi
      .fn<() => Promise<string | undefined>>()
      .mockResolvedValueOnce("first-handle")
      .mockResolvedValueOnce("second-handle");
    const update = vi.fn().mockReturnValueOnce(false);
    const controller = createDroneNotePlaybackController({
      create,
      destroy: vi.fn(),
      update,
    });

    await controller.startNote({ interval: 0, midi: 48 });
    await controller.startNote({ interval: 7, midi: 55 });

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenLastCalledWith([
      { interval: 0, midi: 48 },
      { interval: 7, midi: 55 },
    ]);
  });

  it("clears highlighted notes when audio creation fails", async () => {
    const activeIntervals: number[][] = [];
    const controller = createDroneNotePlaybackController({
      create: vi.fn(async () => undefined),
      destroy: vi.fn(),
      onActiveIntervalsChange: (intervals) => activeIntervals.push(intervals),
      update: vi.fn(),
    });

    await controller.startNote({ interval: 0, midi: 48 });

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(activeIntervals).toStrictEqual([[0], []]);
  });

  it("clears active state immediately when the audio engine resets", async () => {
    const { activeIntervals, controller } = createController();

    await controller.startNote({ interval: 0, midi: 48 });
    controller.reset();

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(activeIntervals).toStrictEqual([[0], []]);
  });

  it("reconciles an empty note set for Stop All", async () => {
    const { controller, update } = createController();

    await controller.startNote({ interval: 0, midi: 48 });
    await controller.startNote({ interval: 7, midi: 55 });
    controller.stopAll();

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", []);
  });

  it("leaves pitch and sound transition choices to the audio engine", async () => {
    const { controller, update } = createController();

    await controller.startNote({
      audioPresetId: "plucked-string",
      interval: 0,
      midi: 48,
      velocity: 0.65,
    });
    controller.reconcileNotes([
      {
        audioPresetId: "bowed-strings",
        interval: 0,
        midi: 60,
        velocity: 0.65,
      },
    ]);

    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      {
        audioPresetId: "bowed-strings",
        interval: 0,
        midi: 60,
        velocity: 0.65,
      },
    ]);
  });

  it("reconciles velocity changes through the persistent group", async () => {
    const { controller, update } = createController();

    await controller.startNote({ interval: 0, midi: 48, velocity: 0.65 });
    controller.reconcileNotes([{ interval: 0, midi: 48, velocity: 0.62 }]);

    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      { interval: 0, midi: 48, velocity: 0.62 },
    ]);
  });

  it("releases notes removed by a collection change incrementally", async () => {
    const { controller, update } = createController();

    await controller.startNote({ interval: 0, midi: 48 });
    await controller.startNote({ interval: 14, midi: 62 });
    controller.reconcileNotes([{ interval: 0, midi: 48 }]);

    expect(controller.getActiveIntervals()).toStrictEqual([0]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      { interval: 0, midi: 48 },
    ]);
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

    expect(root).toBeCloseTo(0.65);
    expect(third).toBeLessThan(root);
    expect(fifth).toBeLessThan(third);
    expect(octave).toBeLessThan(fifth);
    expect(doubleOctave).toBeLessThan(octave);
  });
});
