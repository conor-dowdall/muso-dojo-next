import { describe, expect, it, vi } from "vitest";
import { createAudioReadinessController } from "@/audio/audioReadiness";

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

describe("createAudioReadinessController", () => {
  it("shares an in-flight prepare request and reports readiness", async () => {
    const primeResult = createDeferred<boolean>();
    const controller = createAudioReadinessController({
      isSupported: () => true,
      prime: vi.fn(() => primeResult.promise),
    });
    const snapshots: string[] = [];
    controller.subscribe(() => snapshots.push(controller.getSnapshot().status));

    const first = controller.ensureReady();
    const second = controller.ensureReady();

    expect(controller.getSnapshot().status).toBe("preparing");
    expect(first).toBe(second);

    primeResult.resolve(true);

    await expect(first).resolves.toBe(true);
    expect(controller.getSnapshot().status).toBe("ready");
    expect(snapshots).toEqual(["preparing", "ready"]);
  });

  it("reports unavailable when Web Audio is not supported", async () => {
    const prime = vi.fn();
    const controller = createAudioReadinessController({
      isSupported: () => false,
      prime,
    });

    await expect(controller.ensureReady()).resolves.toBe(false);

    expect(prime).not.toHaveBeenCalled();
    expect(controller.getSnapshot().status).toBe("unavailable");
  });
});
