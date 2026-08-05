import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForServiceWorkerControl } from "@/audio/waitForServiceWorkerControl";

function createServiceWorkerContainer() {
  const events = new EventTarget();
  let resolveReady: (registration: ServiceWorkerRegistration) => void = () =>
    undefined;
  const serviceWorker = {
    controller: null as ServiceWorker | null,
    ready: new Promise<ServiceWorkerRegistration>((resolve) => {
      resolveReady = resolve;
    }),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  };

  return {
    claim() {
      serviceWorker.controller = {} as ServiceWorker;
      events.dispatchEvent(new Event("controllerchange"));
    },
    resolveReady() {
      resolveReady({} as ServiceWorkerRegistration);
    },
    serviceWorker,
  };
}

afterEach(() => vi.useRealTimers());

describe("waitForServiceWorkerControl", () => {
  it("returns immediately when service workers are unavailable", async () => {
    await expect(waitForServiceWorkerControl(undefined, 1_000)).resolves.toBe(
      false,
    );
  });

  it("waits for activation and control before resolving", async () => {
    const { claim, resolveReady, serviceWorker } =
      createServiceWorkerContainer();
    let resolved = false;
    const waiting = waitForServiceWorkerControl(serviceWorker).then((value) => {
      resolved = true;
      return value;
    });

    resolveReady();
    await Promise.resolve();
    expect(resolved).toBe(false);

    claim();
    await expect(waiting).resolves.toBe(true);
  });

  it("falls back and removes its listener when control times out", async () => {
    vi.useFakeTimers();
    const { serviceWorker } = createServiceWorkerContainer();
    const removeEventListener = vi.spyOn(serviceWorker, "removeEventListener");
    const waiting = waitForServiceWorkerControl(serviceWorker, 1_000);

    await vi.advanceTimersByTimeAsync(1_000);

    await expect(waiting).resolves.toBe(false);
    expect(removeEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );
  });

  it("falls back when service-worker readiness rejects", async () => {
    const events = new EventTarget();
    const serviceWorker = {
      controller: null,
      ready: Promise.reject(new Error("registration failed")),
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    };

    await expect(
      waitForServiceWorkerControl(serviceWorker, 1_000),
    ).resolves.toBe(false);
  });
});
