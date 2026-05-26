import { afterEach, describe, expect, it, vi } from "vitest";
import { type StateStorage, type StorageValue } from "zustand/middleware";
import {
  APP_STORE_VERSION,
  createDebouncedAppStoreStorage,
  migrateAppStoreSnapshot,
} from "@/stores/app-store/persistence";
import { createAppStoreSnapshot } from "@/utils/session/normalizeAppStoreSnapshot";
import { type AppStoreSnapshot } from "@/types/session";

const fallbackSnapshot = createAppStoreSnapshot({
  id: "fallback-session",
  name: "Fallback Session",
  lastModified: "2026-01-01T00:00:00.000Z",
  parts: [],
});

function createPersistedSnapshot(sessionId: string): AppStoreSnapshot {
  return {
    activeSessionId: sessionId,
    sessions: {
      [sessionId]: {
        id: sessionId,
        name: "Persisted Session",
        lastModified: "2026-01-02T00:00:00.000Z",
        parts: [],
      },
    },
  };
}

class MemoryStateStorage implements StateStorage {
  readonly items = new Map<string, string>();
  setItemCount = 0;
  removeItemCount = 0;

  getItem(name: string) {
    return this.items.get(name) ?? null;
  }

  setItem(name: string, value: string) {
    this.setItemCount += 1;
    this.items.set(name, value);
  }

  removeItem(name: string) {
    this.removeItemCount += 1;
    this.items.delete(name);
  }
}

function createPersistedValue(
  sessionId: string,
): StorageValue<AppStoreSnapshot> {
  return {
    state: createPersistedSnapshot(sessionId),
    version: APP_STORE_VERSION,
  };
}

describe("app store persistence", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("declares the first stable persisted store version", () => {
    expect(APP_STORE_VERSION).toBe(1);
  });

  it("normalizes unversioned persisted snapshots without resetting sessions", () => {
    const migrated = migrateAppStoreSnapshot(
      createPersistedSnapshot("persisted-session"),
      0,
      fallbackSnapshot,
    );

    expect(migrated.activeSessionId).toBe("persisted-session");
    expect(migrated.sessions["persisted-session"]?.name).toBe(
      "Persisted Session",
    );
  });

  it("normalizes future-version persisted snapshots instead of throwing or resetting", () => {
    const migrated = migrateAppStoreSnapshot(
      createPersistedSnapshot("future-session"),
      APP_STORE_VERSION + 10,
      fallbackSnapshot,
    );

    expect(migrated.activeSessionId).toBe("future-session");
    expect(migrated.sessions["future-session"]?.lastModified).toBe(
      "2026-01-02T00:00:00.000Z",
    );
  });

  it("falls back when persisted state is not an object snapshot", () => {
    expect(migrateAppStoreSnapshot(null, 0, fallbackSnapshot)).toBe(
      fallbackSnapshot,
    );
    expect(migrateAppStoreSnapshot([], 0, fallbackSnapshot)).toBe(
      fallbackSnapshot,
    );
  });

  it("normalizes duplicate ids, invalid active notes, and missing active session ids", () => {
    const migrated = migrateAppStoreSnapshot(
      {
        activeSessionId: "missing-session",
        sessions: {
          stored: {
            id: "session-a",
            name: "Session A",
            lastModified: "2026-01-03T00:00:00.000Z",
            parts: [
              {
                id: "part",
                rootNote: "C",
                noteCollectionKey: "major",
                modules: [
                  {
                    id: "module",
                    type: "instrument",
                    instrument: {
                      type: "fretboard",
                      activeNotes: {
                        valid: { midi: 60, emphasis: "small" },
                        invalidMidi: { midi: 200 },
                        invalidNote: "not-a-note",
                      },
                      activeNotesLocked: true,
                    },
                  },
                  {
                    id: "module",
                    type: "instrument",
                    instrument: {
                      type: "keyboard",
                    },
                  },
                ],
              },
              {
                id: "part",
                rootNote: "D",
                noteCollectionKey: "major",
                modules: [],
              },
            ],
          },
        },
      },
      0,
      fallbackSnapshot,
    );

    const session = migrated.sessions["session-a"];
    if (!session) {
      throw new Error("Expected migrated session to exist");
    }

    expect(migrated.activeSessionId).toBe("session-a");
    expect(session.parts.map((part) => part.id)).toEqual(["part", "part-copy"]);
    expect(session.parts[0]?.modules.map((module) => module.id)).toEqual([
      "module",
      "module-copy",
    ]);

    const firstModule = session.parts[0]?.modules[0];
    if (!firstModule || firstModule.type !== "instrument") {
      throw new Error("Expected first migrated module to be an instrument");
    }

    expect(firstModule.instrument.activeNotes).toEqual({
      valid: { midi: 60, emphasis: "small" },
    });
    expect(firstModule.instrument.activeNotesLocked).toBe(true);
  });

  it("debounces storage writes while exposing pending values to hydration reads", () => {
    vi.useFakeTimers();
    const stateStorage = new MemoryStateStorage();
    const storage = createDebouncedAppStoreStorage(() => stateStorage, {
      debounceMs: 100,
      maxWaitMs: 300,
    });
    const persistedValue = createPersistedValue("debounced-session");

    storage?.setItem("store", persistedValue);

    expect(stateStorage.setItemCount).toBe(0);
    expect(storage?.getItem("store")).toEqual(persistedValue);

    vi.advanceTimersByTime(99);
    expect(stateStorage.setItemCount).toBe(0);

    vi.advanceTimersByTime(1);
    expect(stateStorage.setItemCount).toBe(1);
    expect(JSON.parse(stateStorage.items.get("store") ?? "null")).toEqual(
      persistedValue,
    );
  });

  it("flushes the latest pending write at the max wait boundary", () => {
    vi.useFakeTimers();
    const stateStorage = new MemoryStateStorage();
    const storage = createDebouncedAppStoreStorage(() => stateStorage, {
      debounceMs: 100,
      maxWaitMs: 250,
    });
    const firstValue = createPersistedValue("first-session");
    const middleValue = createPersistedValue("middle-session");
    const latestValue = createPersistedValue("latest-session");

    storage?.setItem("store", firstValue);
    vi.advanceTimersByTime(90);
    storage?.setItem("store", middleValue);
    vi.advanceTimersByTime(90);
    storage?.setItem("store", latestValue);
    vi.advanceTimersByTime(69);

    expect(stateStorage.setItemCount).toBe(0);

    vi.advanceTimersByTime(1);
    expect(stateStorage.setItemCount).toBe(1);
    expect(JSON.parse(stateStorage.items.get("store") ?? "null")).toEqual(
      latestValue,
    );
  });

  it("drops malformed stored JSON and clears pending writes on remove", () => {
    vi.useFakeTimers();
    const stateStorage = new MemoryStateStorage();
    const storage = createDebouncedAppStoreStorage(() => stateStorage, {
      debounceMs: 100,
    });
    const persistedValue = createPersistedValue("removed-session");
    stateStorage.items.set("store", "{not-json");

    expect(storage?.getItem("store")).toBeNull();

    storage?.setItem("store", persistedValue);
    storage?.removeItem("store");
    vi.advanceTimersByTime(100);

    expect(stateStorage.removeItemCount).toBe(1);
    expect(stateStorage.setItemCount).toBe(0);
    expect(storage?.getItem("store")).toBeNull();
  });
});
