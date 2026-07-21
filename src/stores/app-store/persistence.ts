import {
  type PersistStorage,
  type StateStorage,
  type StorageValue,
} from "zustand/middleware";
import { type AppStoreSnapshot } from "@/types/session";
import { normalizeAppStoreSnapshot } from "@/utils/session/normalizeAppStoreSnapshot";

export const APP_STORE_VERSION = 11;
export const APP_STORE_STORAGE_KEY = "muso-dojo-app-store";
export const APP_STORE_PERSISTENCE_DEBOUNCE_MS = 600;
export const APP_STORE_PERSISTENCE_MAX_WAIT_MS = 3000;

export type AppStorePersistedSnapshot = AppStoreSnapshot;
type AppStorePersistedValue = StorageValue<AppStorePersistedSnapshot>;

interface DebouncedAppStoreStorageOptions {
  debounceMs?: number;
  maxWaitMs?: number;
}

export function partializeAppStoreSnapshot(
  state: AppStoreSnapshot,
): AppStorePersistedSnapshot {
  return {
    activeSessionId: state.activeSessionId,
    dojoSettings: state.dojoSettings,
    sessionWorkspaceViewMode: state.sessionWorkspaceViewMode,
    sessions: state.sessions,
  };
}

export function normalizePersistedAppStoreSnapshot(
  persistedState: unknown,
  fallbackSnapshot: AppStoreSnapshot,
): AppStorePersistedSnapshot {
  return normalizeAppStoreSnapshot(persistedState, fallbackSnapshot);
}

function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}

function parsePersistedValue(
  value: string | null,
): AppStorePersistedValue | null {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as AppStorePersistedValue;
  } catch {
    return null;
  }
}

function addPageLifecycleFlushListener(flush: () => void) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const flushWhenHidden = () => {
    if (document.visibilityState === "hidden") {
      flush();
    }
  };

  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", flushWhenHidden);
}

export function createDebouncedAppStoreStorage(
  getStorage: () => StateStorage,
  {
    debounceMs = APP_STORE_PERSISTENCE_DEBOUNCE_MS,
    maxWaitMs = APP_STORE_PERSISTENCE_MAX_WAIT_MS,
  }: DebouncedAppStoreStorageOptions = {},
): PersistStorage<AppStorePersistedSnapshot, void> {
  let storage: StateStorage;

  try {
    storage = getStorage();
  } catch {
    storage = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    };
  }

  const resolvedMaxWaitMs = Math.max(maxWaitMs, debounceMs);
  let pendingName: string | undefined;
  let pendingValue: AppStorePersistedValue | undefined;
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
  let maxWaitTimeout: ReturnType<typeof setTimeout> | undefined;

  const clearDebounceTimeout = () => {
    if (debounceTimeout !== undefined) {
      clearTimeout(debounceTimeout);
      debounceTimeout = undefined;
    }
  };

  const clearMaxWaitTimeout = () => {
    if (maxWaitTimeout !== undefined) {
      clearTimeout(maxWaitTimeout);
      maxWaitTimeout = undefined;
    }
  };

  const clearPendingWrite = () => {
    pendingName = undefined;
    pendingValue = undefined;
    clearDebounceTimeout();
    clearMaxWaitTimeout();
  };

  const flush = () => {
    if (pendingName === undefined || pendingValue === undefined) {
      return;
    }

    const name = pendingName;
    const value = pendingValue;
    clearPendingWrite();

    try {
      const result = storage.setItem(name, JSON.stringify(value));

      if (isPromiseLike(result)) {
        void Promise.resolve(result).catch(() => undefined);
      }
    } catch {
      // Storage failures should not interrupt instrument interactions.
    }
  };

  const scheduleFlush = () => {
    clearDebounceTimeout();
    debounceTimeout = setTimeout(flush, debounceMs);

    if (maxWaitTimeout === undefined) {
      maxWaitTimeout = setTimeout(flush, resolvedMaxWaitMs);
    }
  };

  addPageLifecycleFlushListener(flush);

  return {
    getItem: (name) => {
      if (pendingName === name && pendingValue !== undefined) {
        return pendingValue;
      }

      try {
        const storedValue = storage.getItem(name);

        return isPromiseLike<string | null>(storedValue)
          ? Promise.resolve(storedValue).then(parsePersistedValue, () => null)
          : parsePersistedValue(storedValue);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pendingName = name;
      pendingValue = value;
      scheduleFlush();
    },
    removeItem: (name) => {
      if (pendingName === name) {
        clearPendingWrite();
      }

      try {
        const result = storage.removeItem(name);

        if (isPromiseLike(result)) {
          void Promise.resolve(result).catch(() => undefined);
        }
      } catch {
        // Storage failures should not interrupt store reset operations.
      }
    },
  };
}
