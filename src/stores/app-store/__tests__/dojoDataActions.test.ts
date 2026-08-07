import { describe, expect, it } from "vitest";
import { createStoreSnapshot, createTestStore } from "./appStoreTestUtils";
import { type DojoSettings } from "@/types/session";
import { createFallbackSessionConfig } from "@/utils/session/createSessionEntities";

describe("Dojo data app store actions", () => {
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
