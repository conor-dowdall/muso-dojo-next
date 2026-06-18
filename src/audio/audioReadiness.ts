import { musoAudioEngine } from "./createWebAudioEngine";
import { samplePacks } from "./samplePacks.generated";
import { type AudioEngine } from "./types";

export type AudioReadinessStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "unavailable";

export interface AudioReadinessSnapshot {
  revision: number;
  status: AudioReadinessStatus;
}

type AudioReadinessEngine = Pick<AudioEngine, "isSupported" | "prime">;

const audioSamplePackUrls = Object.values(samplePacks).map((pack) => pack.url);

export function createAudioReadinessController(
  engine: AudioReadinessEngine = musoAudioEngine,
) {
  let snapshot: AudioReadinessSnapshot = {
    revision: 0,
    status: "idle",
  };
  let preparePromise: Promise<boolean> | undefined;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const setStatus = (status: AudioReadinessStatus) => {
    if (snapshot.status === status) {
      return;
    }

    snapshot = {
      revision: snapshot.revision + 1,
      status,
    };
    emit();
  };

  const ensureReady = () => {
    if (snapshot.status === "ready") {
      return Promise.resolve(true);
    }

    if (preparePromise) {
      return preparePromise;
    }

    if (!engine.isSupported()) {
      setStatus("unavailable");
      return Promise.resolve(false);
    }

    setStatus("preparing");
    preparePromise = engine
      .prime()
      .then((ready) => {
        setStatus(ready ? "ready" : "unavailable");
        return ready;
      })
      .catch(() => {
        setStatus("unavailable");
        return false;
      })
      .finally(() => {
        preparePromise = undefined;
      });

    return preparePromise;
  };

  return {
    ensureReady,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const audioReadiness = createAudioReadinessController();

export const ensureAudioReady = audioReadiness.ensureReady;

let cacheWarmPromise: Promise<void> | undefined;

export function warmAudioSamplePackCache() {
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return Promise.resolve();
  }

  if (cacheWarmPromise) {
    return cacheWarmPromise;
  }

  cacheWarmPromise = (async () => {
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.ready.catch(() => undefined);
    }

    await Promise.all(
      audioSamplePackUrls.map((url) =>
        fetch(url, { cache: "force-cache" }).catch(() => undefined),
      ),
    );
  })();

  return cacheWarmPromise;
}
