import { describe, expect, it, vi } from "vitest";
import {
  createDroneNotePlaybackController,
  getDronePlaybackVelocity,
  type DroneNotePlaybackNote,
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
  const activeNoteIds: string[][] = [];
  const controller = createDroneNotePlaybackController({
    create,
    destroy,
    onActiveNoteIdsChange: (ids) => activeNoteIds.push(ids),
    onActiveIntervalsChange: (intervals) => activeIntervals.push(intervals),
    update,
  });

  return {
    activeIntervals,
    activeNoteIds,
    controller,
    create,
    destroy,
    update,
  };
}

function createNote(
  collectionPosition: number,
  interval: number,
  midi: number,
  options: Partial<
    Omit<DroneNotePlaybackNote, "collectionPosition" | "interval" | "midi">
  > = {},
): DroneNotePlaybackNote {
  return {
    collectionPosition,
    collectionSize: 3,
    intervalDegree: collectionPosition + 1,
    interval,
    midi,
    ...options,
  };
}

describe("createDroneNotePlaybackController", () => {
  it("creates one persistent drone and updates it for note toggles", async () => {
    const { activeIntervals, activeNoteIds, controller, create, update } =
      createController();

    await controller.startNote(createNote(0, 0, 48));
    await controller.startNote(createNote(2, 7, 55, { intervalDegree: 5 }));
    controller.toggleNote(createNote(0, 0, 48));

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith([createNote(0, 0, 48)]);
    expect(update).toHaveBeenNthCalledWith(1, "drone-handle", [
      createNote(0, 0, 48),
      createNote(2, 7, 55, { intervalDegree: 5 }),
    ]);
    expect(update).toHaveBeenNthCalledWith(2, "drone-handle", [
      createNote(2, 7, 55, { intervalDegree: 5 }),
    ]);
    expect(activeIntervals).toStrictEqual([[0], [0, 7], [7]]);
    expect(activeNoteIds).toStrictEqual([["0"], ["0", "2"], ["2"]]);
  });

  it("reconciles the latest state after a delayed first handle", async () => {
    const deferred = createDeferred<string | undefined>();
    const update = vi.fn();
    const controller = createDroneNotePlaybackController({
      create: vi.fn(() => deferred.promise),
      destroy: vi.fn(),
      update,
    });

    const startPromise = controller.startNote(
      createNote(2, 7, 55, { intervalDegree: 5 }),
    );
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

    const startPromise = controller.startNote(createNote(0, 0, 48));
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
    await controller.startNote(createNote(0, 0, 48));

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

    const firstStart = controller.startNote(createNote(0, 0, 48));
    controller.dispose();
    controller.activate();
    await controller.startNote(createNote(2, 7, 55, { intervalDegree: 5 }));
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

    await controller.startNote(createNote(0, 0, 48));
    await controller.startNote(createNote(2, 7, 55, { intervalDegree: 5 }));

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenLastCalledWith([
      createNote(0, 0, 48),
      createNote(2, 7, 55, { intervalDegree: 5 }),
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

    await controller.startNote(createNote(0, 0, 48));

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(activeIntervals).toStrictEqual([[0], []]);
  });

  it("clears active state immediately when the audio engine resets", async () => {
    const { activeIntervals, controller } = createController();

    await controller.startNote(createNote(0, 0, 48));
    controller.reset();

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(activeIntervals).toStrictEqual([[0], []]);
  });

  it("reconciles an empty note set for Stop All", async () => {
    const { controller, update } = createController();

    await controller.startNote(createNote(0, 0, 48));
    await controller.startNote(createNote(2, 7, 55, { intervalDegree: 5 }));
    controller.stopAll();

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", []);
  });

  it("leaves pitch and sound transition choices to the audio engine", async () => {
    const { controller, update } = createController();

    await controller.startNote(
      createNote(0, 0, 48, {
        audioPresetId: "plucked-string",
        velocity: 0.65,
      }),
    );
    controller.reconcileNotes([
      createNote(0, 0, 60, {
        audioPresetId: "bowed-strings",
        velocity: 0.65,
      }),
    ]);

    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      createNote(0, 0, 60, {
        audioPresetId: "bowed-strings",
        velocity: 0.65,
      }),
    ]);
  });

  it("reconciles velocity changes through the persistent group", async () => {
    const { controller, update } = createController();

    await controller.startNote(createNote(0, 0, 48, { velocity: 0.65 }));
    controller.reconcileNotes([createNote(0, 0, 48, { velocity: 0.62 })]);

    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      createNote(0, 0, 48, { velocity: 0.62 }),
    ]);
  });

  it("releases notes removed by a collection change incrementally", async () => {
    const { controller, update } = createController();

    await controller.startNote(createNote(0, 0, 48));
    await controller.startNote(createNote(4, 14, 62, { intervalDegree: 9 }));
    controller.reconcileNotes([createNote(0, 0, 48)]);

    expect(controller.getActiveIntervals()).toStrictEqual([0]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      createNote(0, 0, 48),
    ]);
  });

  it("does not confuse collection positions with intervals when stopping", async () => {
    const { controller, update } = createController();

    await controller.startNote(createNote(7, 11, 59));
    controller.stopNote(7);

    expect(controller.getActiveIntervals()).toStrictEqual([11]);
    expect(update).toHaveBeenCalledTimes(0);
  });

  it("preserves active collection positions when intervals change", async () => {
    const { activeIntervals, activeNoteIds, controller, update } =
      createController();

    await controller.startNote(
      createNote(1, 4, 52, { collectionSize: 7, intervalDegree: 3 }),
    );
    controller.reconcileNotes([
      createNote(0, 0, 48, { collectionSize: 7, intervalDegree: 1 }),
      createNote(1, 3, 51, { collectionSize: 7, intervalDegree: 3 }),
    ]);

    expect(controller.getActiveIntervals()).toStrictEqual([3]);
    expect(activeIntervals).toStrictEqual([[4], [3]]);
    expect(activeNoteIds).toStrictEqual([["1"], ["1"]]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      createNote(1, 3, 51, { collectionSize: 7, intervalDegree: 3 }),
    ]);
  });

  it("remaps active notes by interval degree when collection sizes change", async () => {
    const { activeIntervals, activeNoteIds, controller, update } =
      createController();

    await controller.startNote(createNote(0, 0, 48, { intervalDegree: 1 }));
    await controller.startNote(createNote(1, 4, 52, { intervalDegree: 3 }));
    await controller.startNote(createNote(2, 7, 55, { intervalDegree: 5 }));
    controller.reconcileNotes([
      createNote(0, 0, 48, { collectionSize: 7, intervalDegree: 1 }),
      createNote(1, 2, 50, { collectionSize: 7, intervalDegree: 2 }),
      createNote(2, 4, 52, { collectionSize: 7, intervalDegree: 3 }),
      createNote(3, 5, 53, { collectionSize: 7, intervalDegree: 4 }),
      createNote(4, 7, 55, { collectionSize: 7, intervalDegree: 5 }),
    ]);

    expect(controller.getActiveIntervals()).toStrictEqual([0, 4, 7]);
    expect(activeIntervals.at(-1)).toStrictEqual([0, 4, 7]);
    expect(activeNoteIds.at(-1)).toStrictEqual(["0", "2", "4"]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", [
      createNote(0, 0, 48, { collectionSize: 7, intervalDegree: 1 }),
      createNote(2, 4, 52, { collectionSize: 7, intervalDegree: 3 }),
      createNote(4, 7, 55, { collectionSize: 7, intervalDegree: 5 }),
    ]);
  });

  it("drops active degrees that are unavailable after collection size changes", async () => {
    const { activeIntervals, activeNoteIds, controller, update } =
      createController();

    await controller.startNote(
      createNote(8, 14, 62, {
        collectionSize: 7,
        intervalDegree: 9,
      }),
    );
    await controller.startNote(
      createNote(12, 21, 69, {
        collectionSize: 7,
        intervalDegree: 13,
      }),
    );
    controller.reconcileNotes([
      createNote(0, 0, 48, { intervalDegree: 1 }),
      createNote(1, 4, 52, { intervalDegree: 3 }),
      createNote(2, 7, 55, { intervalDegree: 5 }),
    ]);

    expect(controller.getActiveIntervals()).toStrictEqual([]);
    expect(activeIntervals.at(-1)).toStrictEqual([]);
    expect(activeNoteIds.at(-1)).toStrictEqual([]);
    expect(update).toHaveBeenLastCalledWith("drone-handle", []);
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
