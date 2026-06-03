import { describe, expect, it, vi } from "vitest";
import {
  createManualPlaybackController,
  type ManualPlaybackStatus,
} from "@/hooks/audio/useManualPlayback";

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

describe("createManualPlaybackController", () => {
  it("starts and stops a long-running audio handle", async () => {
    const statuses: ManualPlaybackStatus[] = [];
    const stop = vi.fn();
    const controller = createManualPlaybackController({
      onStatusChange: (status) => statuses.push(status),
      start: vi.fn(async () => "handle-1"),
      stop,
    });

    await controller.start();
    controller.stop();

    expect(statuses).toStrictEqual(["starting", "playing", "idle"]);
    expect(stop).toHaveBeenCalledWith("handle-1");
  });

  it("restarts an active handle", async () => {
    let handleIndex = 0;
    const stop = vi.fn();
    const controller = createManualPlaybackController({
      start: vi.fn(async () => `handle-${++handleIndex}`),
      stop,
    });

    await controller.start();
    controller.restart();
    await Promise.resolve();

    expect(stop).toHaveBeenCalledWith("handle-1");
    expect(controller.getStatus()).toBe("playing");
  });

  it("stops a late handle after playback is cancelled", async () => {
    const deferred = createDeferred<string | undefined>();
    const stop = vi.fn();
    const controller = createManualPlaybackController({
      start: vi.fn(() => deferred.promise),
      stop,
    });

    const startPromise = controller.start();
    controller.stop();
    deferred.resolve("late-handle");
    await startPromise;

    expect(controller.getStatus()).toBe("idle");
    expect(stop).toHaveBeenCalledWith("late-handle");
  });
});
