import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import {
  persist,
  type PersistStorage,
  type StateStorage,
  type StorageValue,
} from "zustand/middleware";
import { createAppStoreInitializer } from "@/stores/app-store/storeInitializer";
import {
  APP_STORE_PERSISTENCE_DEBOUNCE_MS,
  APP_STORE_VERSION,
  type AppStorePersistedSnapshot,
  createDebouncedAppStoreStorage,
  reportPersistenceLoadFailure,
  resolvePersistenceLoadFailure,
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
import { arrangementWorkspaceViewModes } from "@/types/arrangement";
import { sessionWorkspaceViewModes } from "@/types/session-view";
import { createDefaultSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import { SnapshotIdentityIntegrityError } from "@/utils/session/assertSnapshotIdentityIntegrity";

const fallbackSnapshot = createAppStoreSnapshot({
  id: "fallback-session",
  name: "Fallback Session",
  lastModified: "2026-01-01T00:00:00.000Z",
  parts: [],
});

function createPersistedSnapshot(sessionId: string): AppStoreSnapshot {
  return {
    activeWorkspace: { kind: "session", id: sessionId },
    arrangements: {},
    activeSessionId: sessionId,
    dojoSettings: {},
    sessions: {
      [sessionId]: {
        backingBand: createDefaultSessionBackingBandConfig(),
        id: sessionId,
        name: "Persisted Session",
        lastModified: "2026-01-02T00:00:00.000Z",
        parts: [],
        workspaceViewMode: "session",
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

  if (snapshot.activeSessionId !== null) {
    const activeSession = snapshot.sessions[snapshot.activeSessionId];
    expect(activeSession).toBeDefined();
  }

  Object.entries(snapshot.sessions).forEach(([sessionKey, session]) => {
    expect(session.id).toBe(sessionKey);
    expect(sessionWorkspaceViewModes).toContain(session.workspaceViewMode);
    expect(new Set(session.parts.map((part) => part.id)).size).toBe(
      session.parts.length,
    );
    const sessionModuleIds = session.parts.flatMap((part) =>
      part.modules.map((partModule) => partModule.id),
    );
    expect(new Set(sessionModuleIds).size).toBe(sessionModuleIds.length);

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

  Object.entries(snapshot.arrangements).forEach(
    ([arrangementKey, arrangement]) => {
      expect(arrangement.id).toBe(arrangementKey);
      expect(arrangementWorkspaceViewModes).toContain(
        arrangement.workspaceViewMode,
      );
    },
  );
}

function createPersistedTestStore(
  storage: PersistStorage<AppStorePersistedSnapshot>,
) {
  return createStore<AppStore>()(
    persist<AppStore, [], [], AppStorePersistedSnapshot>(
      createAppStoreInitializer(fallbackSnapshot),
      {
        name: "store",
        version: APP_STORE_VERSION,
        storage,
        partialize: partializeAppStoreSnapshot,
        migrate: (persistedState) =>
          normalizePersistedAppStoreSnapshot(persistedState, fallbackSnapshot),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...normalizePersistedAppStoreSnapshot(
            persistedState,
            fallbackSnapshot,
          ),
        }),
        skipHydration: true,
      },
    ),
  );
}

describe("app store persistence", () => {
  it("rejects ambiguous persisted identity before normalization", () => {
    expect(() =>
      normalizePersistedAppStoreSnapshot(
        {
          arrangements: {
            arrangement: {
              entries: [{ id: "entry", sectionId: "section" }],
              id: "arrangement",
              sections: [{ id: "section" }, { id: "section" }],
            },
          },
          sessions: {},
        },
        fallbackSnapshot,
      ),
    ).toThrow(SnapshotIdentityIntegrityError);
  });

  afterEach(() => {
    resolvePersistenceLoadFailure();
    vi.useRealTimers();
  });

  it("suspends writes until persistence recovery is explicit", () => {
    vi.useFakeTimers();
    const stateStorage = new MemoryStateStorage();
    const storage = createDebouncedAppStoreStorage(() => stateStorage, {
      debounceMs: 100,
      maxWaitMs: 300,
    });
    const persistedValue = createPersistedValue("protected-session");

    storage?.setItem("store", persistedValue);
    reportPersistenceLoadFailure();
    storage?.setItem("store", persistedValue);
    resolvePersistenceLoadFailure();
    vi.advanceTimersByTime(300);
    expect(stateStorage.setItemCount).toBe(0);

    storage?.setItem("store", persistedValue);
    vi.advanceTimersByTime(100);
    expect(stateStorage.setItemCount).toBe(1);
  });

  it("declares the current persisted store version", () => {
    expect(APP_STORE_VERSION).toBe(15);
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

    const legacySnapshot = createPersistedSnapshot("persisted-session");
    delete (
      legacySnapshot.sessions["persisted-session"] as Partial<
        AppStoreSnapshot["sessions"][string]
      >
    ).workspaceViewMode;
    stateStorage.items.set(
      "store",
      JSON.stringify({
        state: legacySnapshot,
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

  it("normalizes each persisted Session workspace view independently", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const session = persistedState.sessions["persisted-session"]!;

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          sessions: {
            "persisted-session": { ...session, workspaceViewMode: "chart" },
          },
        },
        fallbackSnapshot,
      ).sessions["persisted-session"]?.workspaceViewMode,
    ).toBe("chart");
    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          sessions: {
            "persisted-session": { ...session, workspaceViewMode: "live" },
          },
        },
        fallbackSnapshot,
      ).sessions["persisted-session"]?.workspaceViewMode,
    ).toBe("session");
    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          sessions: {
            "persisted-session": {
              ...session,
              workspaceViewMode: undefined,
            },
          },
        },
        fallbackSnapshot,
      ).sessions["persisted-session"]?.workspaceViewMode,
    ).toBe("session");
  });

  it("normalizes each persisted Arrangement workspace view independently", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const arrangement = {
      entries: [],
      id: "arrangement",
      lastModified: "2026-01-02T00:00:00.000Z",
      name: "Arrangement",
      playbackMode: "once",
      sections: [],
      tempoBpm: 80,
    };

    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          arrangements: {
            arrangement: { ...arrangement, workspaceViewMode: "chart" },
          },
        },
        fallbackSnapshot,
      ).arrangements.arrangement?.workspaceViewMode,
    ).toBe("chart");
    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          arrangements: {
            arrangement: { ...arrangement, workspaceViewMode: "live" },
          },
        },
        fallbackSnapshot,
      ).arrangements.arrangement?.workspaceViewMode,
    ).toBe("build");
    expect(
      normalizeAppStoreSnapshot(
        {
          ...persistedState,
          arrangements: { arrangement },
        },
        fallbackSnapshot,
      ).arrangements.arrangement?.workspaceViewMode,
    ).toBe("build");
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
      progression: {
        kind: "built-in",
        progressionKey: "majorTwoFiveOne",
      },
      rootNote: "D",
    });
  });

  it("normalizes saved custom progressions and custom selection", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const normalized = normalizeAppStoreSnapshot(
      {
        ...persistedState,
        dojoSettings: {
          customChordProgressions: [
            {
              id: "custom-1",
              name: "My Changes",
              progression: {
                chords: [
                  {
                    degree: "1",
                    chordCollectionKey: "major",
                    durationInBars: 1,
                  },
                ],
              },
            },
          ],
          sessionMaterialCreationDefaults: {
            materialKind: "chord-progression",
            progression: { kind: "custom", progressionId: "custom-1" },
          },
        },
      },
      fallbackSnapshot,
    );

    expect(normalized.dojoSettings).toMatchObject({
      customChordProgressions: [
        {
          id: "custom-1",
          name: "My Changes",
        },
      ],
      sessionMaterialCreationDefaults: {
        materialKind: "chord-progression",
        progression: { kind: "custom", progressionId: "custom-1" },
      },
    });
  });

  it("drops a remembered custom progression that is not in the library", () => {
    const persistedState = createPersistedSnapshot("persisted-session");
    const normalized = normalizeAppStoreSnapshot(
      {
        ...persistedState,
        dojoSettings: {
          sessionMaterialCreationDefaults: {
            materialKind: "chord-progression",
            progression: { kind: "custom", progressionId: "missing" },
          },
        },
      },
      fallbackSnapshot,
    );

    expect(normalized.dojoSettings.sessionMaterialCreationDefaults).toEqual({
      materialKind: "chord-progression",
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

  it("normalizes duplicate Session and Arrangement names within their namespaces", () => {
    const normalized = normalizeAppStoreSnapshot(
      {
        activeSessionId: "session-a",
        activeWorkspace: { kind: "session", id: "session-a" },
        arrangements: {
          first: {
            entries: [],
            id: "arrangement-a",
            lastModified: "2026-01-03T00:00:00.000Z",
            name: "Set List",
            sections: [],
          },
          second: {
            entries: [],
            id: "arrangement-b",
            lastModified: "2026-01-03T00:00:00.000Z",
            name: " set list ",
            sections: [],
          },
        },
        dojoSettings: {},
        sessions: {
          first: {
            id: "session-a",
            lastModified: "2026-01-03T00:00:00.000Z",
            name: "Practice",
            parts: [],
          },
          second: {
            id: "session-b",
            lastModified: "2026-01-03T00:00:00.000Z",
            name: " practice ",
            parts: [],
          },
        },
      },
      fallbackSnapshot,
    );

    expect(Object.values(normalized.sessions).map(({ name }) => name)).toEqual([
      "Practice",
      "practice 2",
    ]);
    expect(
      Object.values(normalized.arrangements).map(({ name }) => name),
    ).toEqual(["Set List", "set list 2"]);
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
            "current-session": {
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

  it("falls back to unavailable storage without removing the persist API", async () => {
    const storage = createDebouncedAppStoreStorage(() => {
      throw new Error("Storage access is blocked");
    });
    const store = createPersistedTestStore(storage);
    let didFinishHydration = false;

    store.persist.onFinishHydration(() => {
      didFinishHydration = true;
    });

    await store.persist.rehydrate();

    expect(store.persist.hasHydrated()).toBe(true);
    expect(didFinishHydration).toBe(true);
    expect(partializeAppStoreSnapshot(store.getState())).toEqual(
      fallbackSnapshot,
    );
  });

  it("treats throwing and rejected storage reads as missing data", async () => {
    vi.useFakeTimers();
    const rejectingSetItem = vi.fn(() =>
      Promise.reject(new Error("Async write failed")),
    );
    const rejectingRemoveItem = vi.fn(() =>
      Promise.reject(new Error("Async remove failed")),
    );
    const throwingStorage = createDebouncedAppStoreStorage(() => ({
      getItem: () => {
        throw new Error("Read failed");
      },
      removeItem: () => undefined,
      setItem: () => undefined,
    }));
    const rejectingStorage = createDebouncedAppStoreStorage(() => ({
      getItem: () => Promise.reject(new Error("Async read failed")),
      removeItem: rejectingRemoveItem,
      setItem: rejectingSetItem,
    }));

    expect(throwingStorage.getItem("store")).toBeNull();
    await expect(rejectingStorage.getItem("store")).resolves.toBeNull();

    expect(() =>
      rejectingStorage.setItem("store", createPersistedValue("x")),
    ).not.toThrow();
    vi.advanceTimersByTime(APP_STORE_PERSISTENCE_DEBOUNCE_MS);
    await Promise.resolve();
    expect(() => rejectingStorage.removeItem("store")).not.toThrow();
    await Promise.resolve();

    expect(rejectingSetItem).toHaveBeenCalledOnce();
    expect(rejectingRemoveItem).toHaveBeenCalledOnce();
  });
});
