import { afterEach, describe, expect, it, vi } from "vitest";
import { createAudioReadinessController } from "@/audio/audioReadiness";

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

describe("createAudioReadinessController", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    const preparingSnapshot = controller.getSnapshot();

    expect(controller.getSnapshot().status).toBe("preparing");
    expect(preparingSnapshot.feedbackAttemptRevision).toBe(
      preparingSnapshot.attemptRevision,
    );
    expect(first).toBe(second);

    primeResult.resolve(true);

    await expect(first).resolves.toBe(true);
    expect(controller.getSnapshot().status).toBe("ready");
    expect(snapshots).toEqual(["preparing", "ready"]);
  });

  it("can quietly prepare audio without requesting status feedback", async () => {
    const primeResult = createDeferred<boolean>();
    const controller = createAudioReadinessController({
      isSupported: () => true,
      prime: vi.fn(() => primeResult.promise),
    });

    const preparing = controller.ensureReady({ feedback: "silent" });
    const preparingSnapshot = controller.getSnapshot();

    expect(preparingSnapshot.status).toBe("preparing");
    expect(preparingSnapshot.feedbackAttemptRevision).toBeNull();

    primeResult.resolve(true);

    await expect(preparing).resolves.toBe(true);
    expect(controller.getSnapshot()).toMatchObject({
      feedbackAttemptRevision: null,
      status: "ready",
    });
  });

  it("keeps visible requests quiet during the silent warmup grace period", async () => {
    vi.useFakeTimers();
    const primeResult = createDeferred<boolean>();
    const controller = createAudioReadinessController({
      isSupported: () => true,
      prime: vi.fn(() => primeResult.promise),
    });
    const quietPrepare = controller.ensureReady({ feedback: "silent" });

    expect(controller.getSnapshot().feedbackAttemptRevision).toBeNull();

    const visiblePrepare = controller.ensureReady();
    const sameEventSnapshot = controller.getSnapshot();

    expect(visiblePrepare).toBe(quietPrepare);
    expect(sameEventSnapshot.feedbackAttemptRevision).toBeNull();

    vi.advanceTimersByTime(899);
    expect(controller.getSnapshot().feedbackAttemptRevision).toBeNull();

    vi.advanceTimersByTime(1);
    const promotedSnapshot = controller.getSnapshot();

    expect(promotedSnapshot.feedbackAttemptRevision).toBe(
      promotedSnapshot.attemptRevision,
    );

    primeResult.resolve(true);

    await expect(visiblePrepare).resolves.toBe(true);
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

  it("keeps unsupported quiet checks out of the status feedback path", async () => {
    vi.useFakeTimers();
    const controller = createAudioReadinessController({
      isSupported: () => false,
      prime: vi.fn(),
    });

    await expect(controller.ensureReady({ feedback: "silent" })).resolves.toBe(
      false,
    );

    expect(controller.getSnapshot()).toMatchObject({
      feedbackAttemptRevision: null,
      status: "unavailable",
    });

    await expect(controller.ensureReady()).resolves.toBe(false);
    expect(controller.getSnapshot().feedbackAttemptRevision).toBeNull();

    vi.advanceTimersByTime(900);

    const visibleUnavailableSnapshot = controller.getSnapshot();

    expect(visibleUnavailableSnapshot.feedbackAttemptRevision).toBe(
      visibleUnavailableSnapshot.attemptRevision,
    );
  });
});
