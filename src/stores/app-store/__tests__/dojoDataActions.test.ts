import { describe, expect, it } from "vitest";
import { createStoreSnapshot, createTestStore } from "./appStoreTestUtils";
import { type DojoSettings } from "@/types/session";
import { createFallbackSessionConfig } from "@/utils/session/createSessionEntities";
import { partializeAppStoreSnapshot } from "@/stores/app-store/persistence";

describe("Dojo data app store actions", () => {
  it("imports selected backup resources without replacing active Dojo data", () => {
    const currentSnapshot = createStoreSnapshot();
    currentSnapshot.dojoSettings = {
      appTheme: "ocean",
      customChordProgressions: [
        {
          id: "current-progression",
          name: "My Changes",
          progression: {
            chords: [
              {
                chordCollectionKey: "major",
                degree: "1",
                durationInBars: 1,
              },
            ],
          },
        },
      ],
      noteColorConfig: { preset: "musoDojo", source: "preset" },
    };
    const backupSnapshot = createStoreSnapshot();
    backupSnapshot.activeSessionId = null;
    backupSnapshot.activeWorkspace = null;
    backupSnapshot.sessions = {};
    backupSnapshot.dojoSettings = {
      appTheme: "purple",
      customChordProgressions: [
        {
          id: "backup-progression",
          name: "My Changes",
          progression: {
            chords: [
              {
                chordCollectionKey: "minor",
                degree: "4",
                durationInBars: 1,
              },
            ],
          },
        },
      ],
      customFretboardTunings: [
        {
          id: "backup-tuning",
          instrument: "guitar",
          name: "DADGAD",
          openMidiNotes: [38, 45, 50, 55, 57, 62],
        },
      ],
    };
    const store = createTestStore(currentSnapshot);
    const originalSessions = store.getState().sessions;
    const originalWorkspace = store.getState().activeWorkspace;

    const result = store
      .getState()
      .importDojoBackupResources(backupSnapshot, [
        "progression:backup-progression",
        "tuning:backup-tuning",
      ]);

    const state = store.getState();
    expect(result).toMatchObject({ imported: 2, skipped: 0 });
    expect(state.sessions).toBe(originalSessions);
    expect(state.activeWorkspace).toBe(originalWorkspace);
    expect(state.dojoSettings).toMatchObject({
      appTheme: "ocean",
      noteColorConfig: { preset: "musoDojo", source: "preset" },
    });
    expect(state.dojoSettings.customChordProgressions).toHaveLength(2);
    expect(state.dojoSettings.customChordProgressions?.at(-1)).toMatchObject({
      name: "My Changes Copy",
    });
    expect(state.dojoSettings.customChordProgressions?.at(-1)?.id).not.toBe(
      "backup-progression",
    );
    expect(state.dojoSettings.customFretboardTunings?.at(-1)).toMatchObject({
      name: "DADGAD",
    });
    expect(state.dojoSettings.customFretboardTunings?.at(-1)?.id).not.toBe(
      "backup-tuning",
    );

    const persisted = partializeAppStoreSnapshot(state);
    expect(persisted.dojoSettings.customChordProgressions).toHaveLength(2);
    expect(persisted.dojoSettings.customFretboardTunings).toHaveLength(1);
  });

  it("starts fresh while preserving personal resources and preferences", () => {
    const dojoSettings: DojoSettings = {
      appTheme: "ocean",
      customChordProgressions: [
        {
          id: "progression-1",
          name: "My Changes",
          progression: {
            chords: [
              {
                chordCollectionKey: "major",
                degree: "1",
                durationInBars: 1,
              },
            ],
          },
        },
      ],
      customFretboardTunings: [
        {
          id: "tuning-1",
          instrument: "guitar",
          name: "Open D",
          openMidiNotes: [38, 45, 50, 54, 57, 62],
        },
      ],
      moduleCreationDefaults: {
        keyboard: { theme: "studio" },
        moduleKindDefaults: { session: ["keyboard"] },
      },
      noteColorConfig: { preset: "musoDojo", source: "preset" },
      sessionMaterialCreationDefaults: {
        materialKind: "chord-progression",
        noteCollectionKey: "minor",
        progression: {
          kind: "custom",
          progressionId: "progression-1",
        },
        rootNote: "D",
      },
    };
    const originalSnapshot = createStoreSnapshot();
    const originalSession = originalSnapshot.sessions["session-1"];
    const store = createTestStore({
      ...originalSnapshot,
      activeSessionId: null,
      activeWorkspace: { id: "arrangement-1", kind: "arrangement" },
      arrangements: {
        "arrangement-1": {
          entries: [],
          id: "arrangement-1",
          lastModified: "2026-01-02T00:00:00.000Z",
          name: "Store Test Arrangement",
          playbackMode: "once",
          sections: [],
          tempoBpm: 80,
        },
      },
      dojoSettings,
      sessionWorkspaceViewMode: "chart",
      sessions: {
        ...originalSnapshot.sessions,
        "session-2": {
          id: "session-2",
          lastModified: "2026-01-02T00:00:00.000Z",
          name: "Second Session",
          parts: [],
        },
      },
    });
    const originalStartFreshAction = store.getState().startFreshDojo;
    const preservedSettings = store.getState().dojoSettings;

    store.getState().startFreshDojo();

    const fresh = store.getState();
    const freshSession = createFallbackSessionConfig();
    expect(fresh.sessions).toEqual({ [freshSession.id]: freshSession });
    expect(fresh.sessions[freshSession.id]).not.toBe(originalSession);
    expect(fresh.arrangements).toEqual({});
    expect(fresh.activeWorkspace).toEqual({
      id: freshSession.id,
      kind: "session",
    });
    expect(fresh.activeSessionId).toBe(freshSession.id);
    expect(fresh.sessionWorkspaceViewMode).toBe("session");
    expect(fresh.dojoSettings).toBe(preservedSettings);
    expect(fresh.dojoSettings).toEqual(dojoSettings);
    expect(fresh.startFreshDojo).toBe(originalStartFreshAction);
  });
});
