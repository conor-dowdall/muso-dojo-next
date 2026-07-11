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
  normalizePersistedAppStoreSnapshot,
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
import { type NoteColorConfig } from "@/types/note-colors";
import { sessionWorkspaceViewModes } from "@/types/session-view";

const fallbackSnapshot = createAppStoreSnapshot({
  id: "fallback-session",
  name: "Fallback Session",
  lastModified: "2026-01-01T00:00:00.000Z",
  parts: [],
});

function createPersistedSnapshot(sessionId: string): AppStoreSnapshot {
  return {
    activeSessionId: sessionId,
    dojoSettings: {},
    sessionWorkspaceViewMode: "session",
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
  expect(snapshot.dojoSettings).toEqual(expect.any(Object));
  expect(sessionWorkspaceViewModes).toContain(
    snapshot.sessionWorkspaceViewMode,
  );

  if (snapshot.activeSessionId !== null) {
    const activeSession = snapshot.sessions[snapshot.activeSessionId];
    expect(activeSession).toBeDefined();

    if (snapshot.sessionWorkspaceViewMode !== "session") {
      expect(activeSession?.parts.length).toBeGreaterThan(0);
    }
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
        migrate: (persistedState) =>
          normalizePersistedAppStoreSnapshot(persistedState, fallbackSnapshot),
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

  it("declares the current persisted store version", () => {
    expect(APP_STORE_VERSION).toBe(7);
  });

  it("falls back when persisted state is not an object snapshot", () => {
    expect(normalizeAppStoreSnapshot(null, fallbackSnapshot)).toBe(
      fallbackSnapshot,
    );
    expect(normalizeAppStoreSnapshot([], fallbackSnapshot)).toBe(
      fallbackSnapshot,
    );
    expect(normalizePersistedAppStoreSnapshot(null, fallbackSnapshot)).toBe(
      fallbackSnapshot,
    );
  });

  it("normalizes versioned persisted snapshots during hydration", async () => {
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
        state: createPersistedSnapshot("persisted-session"),
        version: APP_STORE_VERSION - 1,
      }),
    );

    const store = createPersistedTestStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().activeSessionId).toBe("persisted-session");
    expect(store.getState().sessions["persisted-session"]?.name).toBe(
      "Persisted Session",
    );

    vi.advanceTimersByTime(100);
    expect(JSON.parse(stateStorage.items.get("store") ?? "null")).toEqual({
      state: createPersistedSnapshot("persisted-session"),
      version: APP_STORE_VERSION,
    });
  });

  it("normalizes dojo settings while ignoring invalid settings", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const presetDefault = {
      source: "preset",
      preset: "musoDojo",
    } satisfies NoteColorConfig;

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            appTheme: "ocean",
          },
        },
        fallbackSnapshot,
      ).dojoSettings.appTheme,
    ).toBe("ocean");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            appTheme: "system",
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            appTheme: "not-a-theme",
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            noteColorConfig: presetDefault,
          },
        },
        fallbackSnapshot,
      ).dojoSettings.noteColorConfig,
    ).toEqual(presetDefault);

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            noteColorConfig: {
              source: "preset",
              preset: "not-a-preset",
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            noteColorConfig: { source: "theme" },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});
  });

  it("normalizes the persisted workspace view against the active Session", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    persistedState.sessions["persisted-session"]?.parts.push({
      id: "part-1",
      rootNote: "C",
      noteCollectionKey: "major",
      modules: [],
    });

    expect(
      normalizeAppStoreSnapshot(
        { ...persistedState, sessionWorkspaceViewMode: "chart" },
        fallbackSnapshot,
      ).sessionWorkspaceViewMode,
    ).toBe("chart");
    expect(
      normalizeAppStoreSnapshot(
        { ...persistedState, sessionWorkspaceViewMode: "not-a-view" },
        fallbackSnapshot,
      ).sessionWorkspaceViewMode,
    ).toBe("session");
    expect(
      normalizeAppStoreSnapshot(
        { ...persistedState, sessionWorkspaceViewMode: "live" },
        fallbackSnapshot,
      ).sessionWorkspaceViewMode,
    ).toBe("session");
    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          sessionWorkspaceViewMode: "chart",
          sessions: {
            "persisted-session": {
              ...persistedState.sessions["persisted-session"],
              parts: [],
            },
          },
        },
        fallbackSnapshot,
      ).sessionWorkspaceViewMode,
    ).toBe("session");
  });

  it("normalizes valid custom dojo note colors", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const normalized = normalizeAppStoreSnapshot(
      {
        ...persistedState,
        dojoSettings: {
          noteColorConfig: {
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
    ).dojoSettings.noteColorConfig;

    expect(normalized).toMatchObject({
      source: "custom",
      name: "My Colors",
      mode: "relative",
    });
    expect(normalized?.source === "custom" && normalized.colors[0]).toBe(
      "#FF0000",
    );
  });

  it("normalizes remembered session material creation defaults", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            sessionMaterialCreationDefaults: {
              chordListMode: "each-chord-once",
              materialKind: "chord-progression",
              noteCollectionKey: "minor",
              progressionKey: "majorTwoFiveOne",
              rootNote: "D",
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings.sessionMaterialCreationDefaults,
    ).toEqual({
      chordListMode: "each-chord-once",
      materialKind: "chord-progression",
      noteCollectionKey: "minor",
      progressionKey: "majorTwoFiveOne",
      rootNote: "D",
    });
  });

  it("drops built-in and invalid session material creation defaults", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            sessionMaterialCreationDefaults: {
              chordListMode: "full-song-order",
              materialKind: "part",
              noteCollectionKey: "major",
              progressionKey: "oneOneFiveFive",
              rootNote: "C",
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            sessionMaterialCreationDefaults: {
              chordListMode: "not-a-mode",
              materialKind: "not-a-kind",
              noteCollectionKey: "not-a-collection",
              progressionKey: "not-a-progression",
              rootNote: "not-a-note",
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});
  });

  it("normalizes remembered module creation defaults", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            moduleCreationDefaults: {
              moduleKindDefaults: {
                session: ["keyboard", "drone", "keyboard"],
              },
              drone: {
                octaveOffset: 1,
                wood: "pauFerro",
              },
              exerciseLooper: {
                octaveOffset: 0,
              },
              fretboard: {
                instrument: "guitar",
                tuningKey: "guitarDropD",
                handedness: "left",
                appearanceSource: "custom",
                theme: "maple",
                inlayPreset: "dots",
                range: {
                  source: "custom",
                  fretRange: [0, 24],
                },
              },
              keyboard: {
                theme: "studio",
                range: {
                  source: "named",
                  range: "keys61",
                },
              },
              rhythm: {
                wood: "ebony",
              },
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings.moduleCreationDefaults,
    ).toEqual({
      moduleKindDefaults: {
        session: ["keyboard", "drone"],
      },
      drone: {
        octaveOffset: 1,
        wood: "pauFerro",
      },
      exerciseLooper: {
        octaveOffset: 0,
      },
      fretboard: {
        instrument: "guitar",
        tuningKey: "guitarDropD",
        handedness: "left",
        appearanceSource: "custom",
        theme: "maple",
        inlayPreset: "dots",
        range: {
          source: "custom",
          fretRange: [0, 24],
        },
      },
      keyboard: {
        theme: "studio",
        range: {
          source: "named",
          range: "keys61",
        },
      },
      rhythm: {
        wood: "ebony",
      },
    });
  });

  it("ignores stale remembered instrument setup shapes", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            defaultInstrumentSetup: {
              instrumentType: "keyboard",
              setup: {
                theme: "studio",
              },
            },
            instrumentCreationDefaults: {
              keyboard: {
                theme: "studio",
              },
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});
  });

  it("ignores stale per-context module creation recipes", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            moduleCreationDefaults: {
              sessionModuleKinds: ["keyboard"],
              partModuleKinds: ["drone"],
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});
  });

  it("ignores invalid remembered module creation defaults", () => {
    const persistedState = createPersistedSnapshot("persisted-session");

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          dojoSettings: {
            moduleCreationDefaults: {
              moduleKindDefaults: {
                session: ["not-a-module"],
              },
              fretboard: {
                instrument: "not-an-instrument",
                tuningKey: "guitarDropD",
              },
            },
          },
        },
        fallbackSnapshot,
      ).dojoSettings,
    ).toEqual({});
  });

  it("normalizes duplicate ids, invalid active notes, and missing active session ids", () => {
    const normalized = normalizeAppStoreSnapshot(
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
      fallbackSnapshot,
    );

    const session = normalized.sessions["session-a"];
    if (!session) {
      throw new Error("Expected normalized session to exist");
    }

    expect(normalized.activeSessionId).toBe("session-a");
    expect(session.parts.map((part) => part.id)).toEqual(["part", "part-copy"]);
    expect(session.parts[0]?.modules.map((module) => module.id)).toEqual([
      "module",
      "module-copy",
    ]);

    const firstModule = session.parts[0]?.modules[0];
    if (!firstModule || firstModule.type !== "instrument") {
      throw new Error("Expected first normalized module to be an instrument");
    }

    expect(firstModule.instrument.activeNotes).toEqual({
      valid: { midi: 60, emphasis: "small" },
    });
    expect(firstModule.instrument.activeNotesLocked).toBe(true);
    expect(firstModule.instrument.activeNotesLockSourceKey).toBe(
      '["C","major","guitar"]',
    );
    expectValidSnapshotInvariants(normalized);
    expect(normalizeAppStoreSnapshot(normalized, fallbackSnapshot)).toEqual(
      normalized,
    );
  });

  it("normalizes locked instruments with no recoverable active notes to unlocked instruments", () => {
    const normalized = normalizeAppStoreSnapshot(
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
      fallbackSnapshot,
    );
    const partModule = normalized.sessions["session-a"]?.parts[0]
      ?.modules[0] as InstrumentPartModuleConfig;

    expect(partModule.instrument).not.toHaveProperty("activeNotes");
    expect(partModule.instrument).not.toHaveProperty("activeNotesLocked");
    expectValidSnapshotInvariants(normalized);
  });

  it("normalizes locked instruments without a source key to unlocked custom notes", () => {
    const normalized = normalizeAppStoreSnapshot(
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
      fallbackSnapshot,
    );
    const partModule = normalized.sessions["session-a"]?.parts[0]
      ?.modules[0] as InstrumentPartModuleConfig;

    expect(partModule.instrument.activeNotes).toEqual({
      c4: { midi: 60, emphasis: "small" },
    });
    expect(partModule.instrument).not.toHaveProperty("activeNotesLocked");
    expect(partModule.instrument).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
    expectValidSnapshotInvariants(normalized);
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
