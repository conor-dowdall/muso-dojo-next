import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import {
  persist,
  type PersistStorage,
  type StateStorage,
  type StorageValue,
} from "zustand/middleware";
import { createAppStoreActions } from "@/stores/app-store/actions";
import {
  APP_STORE_VERSION,
  type AppStorePersistedSnapshot,
  createDebouncedAppStoreStorage,
  migrateAppStoreSnapshot,
  partializeAppStoreSnapshot,
} from "@/stores/app-store/persistence";
import { type AppStore } from "@/stores/app-store/types";
import {
  createAppStoreSnapshot,
  normalizeAppStoreSnapshot,
} from "@/utils/session/normalizeAppStoreSnapshot";
import {
  type AppStoreSnapshot,
  type InstrumentPartModuleConfig,
} from "@/types/session";
import { type SessionNoteColorConfig } from "@/types/note-colors";

const fallbackSnapshot = createAppStoreSnapshot({
  id: "fallback-session",
  name: "Fallback Session",
  lastModified: "2026-01-01T00:00:00.000Z",
  parts: [],
});

function createPersistedSnapshot(sessionId: string): AppStoreSnapshot {
  return {
    activeSessionId: sessionId,
    preferences: {},
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

function expectValidSnapshotInvariants(snapshot: AppStoreSnapshot) {
  expect(snapshot.preferences).toEqual(expect.any(Object));

  if (snapshot.activeSessionId !== null) {
    expect(snapshot.sessions[snapshot.activeSessionId]).toBeDefined();
  }

  Object.entries(snapshot.sessions).forEach(([sessionKey, session]) => {
    expect(session.id).toBe(sessionKey);
    expect(new Set(session.parts.map((part) => part.id)).size).toBe(
      session.parts.length,
    );

    session.parts.forEach((part) => {
      expect(new Set(part.modules.map((module) => module.id)).size).toBe(
        part.modules.length,
      );

      part.modules.forEach((partModule) => {
        if (partModule.type !== "instrument") {
          return;
        }

        const instrument = partModule.instrument;
        if (instrument.activeNotesLocked === true) {
          expect(instrument.activeNotes).toBeDefined();
          expect(instrument.activeNotesLockSourceKey).toEqual(
            expect.any(String),
          );
        }
      });
    });
  });
}

function createPersistedTestStore(
  storage: PersistStorage<AppStorePersistedSnapshot>,
) {
  return createStore<AppStore>()(
    persist<AppStore, [], [], AppStorePersistedSnapshot>(
      (set, get) => ({
        ...fallbackSnapshot,
        ...createAppStoreActions(set, get),
      }),
      {
        name: "store",
        version: APP_STORE_VERSION,
        storage,
        partialize: partializeAppStoreSnapshot,
        migrate: (persistedState, persistedVersion) =>
          migrateAppStoreSnapshot(
            persistedState,
            persistedVersion,
            fallbackSnapshot,
          ),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...normalizeAppStoreSnapshot(persistedState, fallbackSnapshot),
        }),
        skipHydration: true,
      },
    ),
  );
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

  it("normalizes app preferences while ignoring invalid defaults", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const presetDefault = {
      source: "preset",
      preset: "musoDojo",
    } satisfies SessionNoteColorConfig;

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            appTheme: "ocean",
          },
        },
        fallbackSnapshot,
      ).preferences.appTheme,
    ).toBe("ocean");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            appTheme: "system",
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            appTheme: "not-a-theme",
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            defaultSessionNoteColorConfig: presetDefault,
          },
        },
        fallbackSnapshot,
      ).preferences.defaultSessionNoteColorConfig,
    ).toEqual(presetDefault);

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            defaultSessionNoteColorConfig: {
              source: "preset",
              preset: "not-a-preset",
            },
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            defaultSessionNoteColorConfig: { source: "theme" },
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            masterAmbiencePresetId: "soft-echo",
          },
        },
        fallbackSnapshot,
      ).preferences.masterAmbiencePresetId,
    ).toBe("soft-echo");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            masterAmbiencePresetId: "dojo-room",
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            masterAmbiencePresetId: "not-a-sound",
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});
  });

  it("normalizes valid custom note color defaults", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const normalized = normalizeAppStoreSnapshot(
      {
        ...persistedState,
        preferences: {
          defaultSessionNoteColorConfig: {
            source: "custom",
            name: "My Colors",
            mode: "relative",
            colors: Array.from({ length: 12 }, (_, index) =>
              index % 2 === 0 ? "#ff0000" : null,
            ),
          },
        },
      },
      fallbackSnapshot,
    ).preferences.defaultSessionNoteColorConfig;

    expect(normalized).toMatchObject({
      source: "custom",
      name: "My Colors",
      mode: "relative",
    });
    expect(normalized?.source === "custom" && normalized.colors[0]).toBe(
      "#FF0000",
    );
  });

  it("normalizes remembered default instrument setup", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            defaultInstrumentSetup: {
              instrumentType: "fretboard",
              setup: {
                instrument: "guitar",
                tuningKey: "guitarDropD",
                handedness: "left",
                appearanceSource: "custom",
                theme: "maple",
                inlayPreset: "dots",
                fretRange: [0, 24],
              },
            },
          },
        },
        fallbackSnapshot,
      ).preferences.defaultInstrumentSetup,
    ).toEqual({
      instrumentType: "fretboard",
      setup: {
        instrument: "guitar",
        tuningKey: "guitarDropD",
        handedness: "left",
        appearanceSource: "custom",
        theme: "maple",
        inlayPreset: "dots",
      },
    });
  });

  it("ignores stale remembered instrument setup shapes", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            instrumentCreationDefaults: {
              keyboard: {
                theme: "studio",
              },
            },
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});
  });

  it("ignores invalid remembered default instrument setup", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          preferences: {
            defaultInstrumentSetup: {
              instrumentType: "fretboard",
              setup: {
                instrument: "not-an-instrument",
                tuningKey: "guitarDropD",
              },
            },
          },
        },
        fallbackSnapshot,
      ).preferences,
    ).toEqual({});
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
                      activeNotesLockSourceKey: '["C","major","guitar"]',
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
    expect(firstModule.instrument.activeNotesLockSourceKey).toBe(
      '["C","major","guitar"]',
    );
    expectValidSnapshotInvariants(migrated);
    expect(normalizeAppStoreSnapshot(migrated, fallbackSnapshot)).toEqual(
      migrated,
    );
  });

  it("normalizes locked instruments with no recoverable active notes to unlocked instruments", () => {
    const migrated = migrateAppStoreSnapshot(
      {
        activeSessionId: "session-a",
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
                        invalidMidi: { midi: 200 },
                      },
                      activeNotesLocked: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      0,
      fallbackSnapshot,
    );
    const partModule = migrated.sessions["session-a"]?.parts[0]
      ?.modules[0] as InstrumentPartModuleConfig;

    expect(partModule.instrument).not.toHaveProperty("activeNotes");
    expect(partModule.instrument).not.toHaveProperty("activeNotesLocked");
    expectValidSnapshotInvariants(migrated);
  });

  it("normalizes locked instruments without a source key to unlocked custom notes", () => {
    const migrated = migrateAppStoreSnapshot(
      {
        activeSessionId: "session-a",
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
                        c4: { midi: 60, emphasis: "small" },
                      },
                      activeNotesLocked: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      0,
      fallbackSnapshot,
    );
    const partModule = migrated.sessions["session-a"]?.parts[0]
      ?.modules[0] as InstrumentPartModuleConfig;

    expect(partModule.instrument.activeNotes).toEqual({
      c4: { midi: 60, emphasis: "small" },
    });
    expect(partModule.instrument).not.toHaveProperty("activeNotesLocked");
    expect(partModule.instrument).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
    expectValidSnapshotInvariants(migrated);
  });

  it("hydrates unversioned storage through Zustand persist and rewrites it at the current version", async () => {
    vi.useFakeTimers();
    const stateStorage = new MemoryStateStorage();
    const storage = createDebouncedAppStoreStorage(() => stateStorage, {
      debounceMs: 100,
      maxWaitMs: 300,
    });
    if (!storage) {
      throw new Error("Expected test storage to be available");
    }

    stateStorage.items.set(
      "store",
      JSON.stringify({
        state: createPersistedSnapshot("legacy-session"),
      }),
    );

    const store = createPersistedTestStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().activeSessionId).toBe("legacy-session");
    expect(store.getState().sessions["legacy-session"]?.name).toBe(
      "Persisted Session",
    );

    vi.advanceTimersByTime(100);
    expect(JSON.parse(stateStorage.items.get("store") ?? "null")).toEqual({
      state: createPersistedSnapshot("legacy-session"),
      version: APP_STORE_VERSION,
    });
  });

  it("defensively normalizes current-version storage during merge", async () => {
    const stateStorage = new MemoryStateStorage();
    const storage = createDebouncedAppStoreStorage(() => stateStorage);
    if (!storage) {
      throw new Error("Expected test storage to be available");
    }

    stateStorage.items.set(
      "store",
      JSON.stringify({
        state: {
          activeSessionId: "missing-session",
          sessions: {
            stored: {
              id: "current-session",
              name: "Current Session",
              lastModified: "2026-01-04T00:00:00.000Z",
              parts: [
                {
                  id: "part",
                  rootNote: "Not a note",
                  noteCollectionKey: "not-a-scale",
                  modules: [
                    {
                      id: "module",
                      type: "instrument",
                      instrument: {
                        type: "fretboard",
                        activeNotesLocked: true,
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        version: APP_STORE_VERSION,
      }),
    );

    const store = createPersistedTestStore(storage);
    await store.persist.rehydrate();
    const snapshot = partializeAppStoreSnapshot(store.getState());
    const partModule = snapshot.sessions["current-session"]?.parts[0]
      ?.modules[0] as InstrumentPartModuleConfig;

    expect(snapshot.activeSessionId).toBe("current-session");
    expect(snapshot.sessions["current-session"]?.parts[0]?.rootNote).toBe("C");
    expect(
      snapshot.sessions["current-session"]?.parts[0]?.noteCollectionKey,
    ).toBe("major");
    expect(partModule.instrument).not.toHaveProperty("activeNotesLocked");
    expectValidSnapshotInvariants(snapshot);
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
