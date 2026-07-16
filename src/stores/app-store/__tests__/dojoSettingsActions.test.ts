import { describe, expect, it } from "vitest";
import {
  createStoreSnapshot,
  createTestStore,
  sessionId,
} from "./appStoreTestUtils";

const musoDojoNoteColors = {
  source: "preset",
  preset: "musoDojo",
} as const;

describe("dojo settings app store actions", () => {
  it("creates, edits, and deletes custom progressions without changing sessions", () => {
    const store = createTestStore();
    const existingSession = store.getState().sessions[sessionId];
    const progression = {
      chords: [
        {
          degree: "1" as const,
          chordCollectionKey: "major" as const,
          durationInBars: 1,
        },
      ],
    };
    const progressionId = store.getState().addCustomChordProgression({
      name: "My Changes",
      progression,
    });

    expect(progressionId).toMatch(/^progression-/);
    expect(store.getState().dojoSettings.customChordProgressions).toEqual([
      { id: progressionId, name: "My Changes", progression },
    ]);

    store.getState().updateCustomChordProgression(progressionId ?? "", {
      name: "My Turnaround",
      progression,
    });

    expect(
      store.getState().dojoSettings.customChordProgressions?.[0]?.name,
    ).toBe("My Turnaround");
    expect(store.getState().sessions[sessionId]).toBe(existingSession);

    store.getState().removeCustomChordProgression(progressionId ?? "");

    expect(
      store.getState().dojoSettings.customChordProgressions,
    ).toBeUndefined();
    expect(store.getState().sessions[sessionId]).toBe(existingSession);
  });

  it("rejects duplicate custom progression names", () => {
    const store = createTestStore();
    const progression = {
      chords: [
        {
          degree: "1" as const,
          chordCollectionKey: "major" as const,
          durationInBars: 1,
        },
      ],
    };

    expect(
      store.getState().addCustomChordProgression({
        name: "My Changes",
        progression,
      }),
    ).toBeDefined();
    expect(
      store.getState().addCustomChordProgression({
        name: " my changes ",
        progression,
      }),
    ).toBeUndefined();
  });

  it("creates, edits, and deletes custom tunings without changing sessions", () => {
    const store = createTestStore();
    const existingSession = store.getState().sessions[sessionId];
    const tuningId = store.getState().addCustomFretboardTuning({
      instrument: "guitar",
      name: "Open D",
      openMidiNotes: [38, 45, 50, 54, 57, 62],
    });

    expect(tuningId).toMatch(/^tuning-/);
    expect(store.getState().dojoSettings.customFretboardTunings).toEqual([
      {
        id: tuningId,
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      },
    ]);

    store.getState().updateCustomFretboardTuning(tuningId ?? "", {
      instrument: "guitar",
      name: "Open D Major",
      openMidiNotes: [38, 45, 50, 54, 57, 62],
    });

    expect(
      store.getState().dojoSettings.customFretboardTunings?.[0]?.name,
    ).toBe("Open D Major");
    expect(store.getState().sessions[sessionId]).toBe(existingSession);

    store.getState().removeCustomFretboardTuning(tuningId ?? "");

    expect(
      store.getState().dojoSettings.customFretboardTunings,
    ).toBeUndefined();
    expect(store.getState().sessions[sessionId]).toBe(existingSession);
  });

  it("rejects duplicate custom tuning names for the same instrument", () => {
    const store = createTestStore();

    expect(
      store.getState().addCustomFretboardTuning({
        instrument: "guitar",
        name: "Open D",
        openMidiNotes: [38, 45, 50, 54, 57, 62],
      }),
    ).toBeDefined();
    expect(
      store.getState().addCustomFretboardTuning({
        instrument: "guitar",
        name: " open d ",
        openMidiNotes: [40, 45, 50, 55, 59, 64],
      }),
    ).toBeUndefined();
    expect(
      store.getState().addCustomFretboardTuning({
        instrument: "ukulele",
        name: "Open D",
        openMidiNotes: [69, 62, 66, 71],
      }),
    ).toBeDefined();
  });

  it("stores the selected app theme setting", () => {
    const store = createTestStore();

    store.getState().setAppTheme("ocean");

    expect(store.getState().dojoSettings.appTheme).toBe("ocean");
  });

  it("clears the stored app theme setting when using the system theme", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        appTheme: "purple",
      },
    });

    store.getState().setAppTheme("system");

    expect(store.getState().dojoSettings).toEqual({});
  });

  it("does not notify subscribers when the selected app theme is unchanged", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        appTheme: "ocean",
      },
    });
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setAppTheme("ocean");

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("stores the selected dojo note colors setting", () => {
    const store = createTestStore();

    store.getState().setNoteColorConfig(musoDojoNoteColors);

    expect(store.getState().dojoSettings.noteColorConfig).toEqual(
      musoDojoNoteColors,
    );
  });

  it("clears the stored dojo note colors setting when choosing the built-in default", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        noteColorConfig: musoDojoNoteColors,
      },
    });

    store.getState().setNoteColorConfig({ source: "theme" });

    expect(store.getState().dojoSettings).toEqual({});
  });

  it("keeps dojo note colors independent of session creation", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        noteColorConfig: musoDojoNoteColors,
      },
    });
    const existingSession = store.getState().sessions[sessionId];

    const newSessionId = store.getState().addSession({ name: "Practice" });

    expect(store.getState().sessions[newSessionId]).not.toHaveProperty(
      "noteColorConfig",
    );
    expect(store.getState().sessions[sessionId]).toBe(existingSession);
    expect(store.getState().sessions[sessionId]).not.toHaveProperty(
      "noteColorConfig",
    );
  });

  it("keeps dojo note colors independent of cloned and imported sessions", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        noteColorConfig: musoDojoNoteColors,
      },
    });
    const importedSession = {
      id: "imported-session",
      name: "Imported Session",
      lastModified: "2026-01-02T00:00:00.000Z",
      parts: [],
    };

    const clonedSessionId = store.getState().cloneSession(sessionId);
    const importedSessionId = store.getState().importSession(importedSession);

    expect(store.getState().dojoSettings.noteColorConfig).toEqual(
      musoDojoNoteColors,
    );
    expect(
      clonedSessionId ? store.getState().sessions[clonedSessionId] : undefined,
    ).not.toHaveProperty("noteColorConfig");
    expect(store.getState().sessions[importedSessionId]).not.toHaveProperty(
      "noteColorConfig",
    );
  });

  it("stores remembered module creation selections and setup", () => {
    const store = createTestStore();

    store.getState().rememberModuleCreation({
      context: "session",
      moduleKinds: ["keyboard", "drone", "keyboard"],
      drone: {
        octaveOffset: 1,
        wood: "ebony",
      },
      exerciseLooper: {
        octaveOffset: 0,
      },
      keyboard: {
        theme: "studio",
      },
    });
    store.getState().rememberModuleCreation({
      context: "part",
      moduleKinds: ["fretboard", "drone", "rhythm"],
      fretboard: {
        instrument: "guitar",
        tuningKey: "guitarDropD",
        handedness: "left",
        appearanceSource: "custom",
        theme: "maple",
        inlayPreset: "dots",
      },
      rhythm: {
        wood: "maple",
      },
    });

    expect(store.getState().dojoSettings.moduleCreationDefaults).toEqual({
      moduleKindDefaults: {
        session: ["keyboard", "drone"],
        part: ["fretboard", "drone", "rhythm"],
      },
      keyboard: {
        theme: "studio",
      },
      drone: {
        octaveOffset: 1,
        wood: "ebony",
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
      },
      rhythm: {
        wood: "maple",
      },
    });
  });

  it("does not notify subscribers when remembered module creation is unchanged", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        moduleCreationDefaults: {
          moduleKindDefaults: {
            session: ["keyboard"],
          },
          keyboard: {
            theme: "studio",
          },
        },
      },
    });
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().rememberModuleCreation({
      context: "session",
      moduleKinds: ["keyboard"],
      keyboard: {
        theme: "studio",
      },
    });

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("clears remembered module creation when restoring the built-in default", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        moduleCreationDefaults: {
          moduleKindDefaults: {
            session: ["keyboard"],
          },
        },
      },
    });

    store.getState().rememberModuleCreation({
      context: "session",
      moduleKinds: ["fretboard"],
    });

    expect(store.getState().dojoSettings).toEqual({});
  });

  it("stores remembered session material creation choices", () => {
    const store = createTestStore();

    store.getState().rememberSessionMaterialCreation({
      chordListMode: "full-song-order",
      materialKind: "chord-progression",
      noteCollectionKey: "minor",
      progression: {
        kind: "built-in",
        progressionKey: "majorTwoFiveOne",
      },
      rootNote: "D",
    });

    expect(
      store.getState().dojoSettings.sessionMaterialCreationDefaults,
    ).toEqual({
      materialKind: "chord-progression",
      noteCollectionKey: "minor",
      progression: {
        kind: "built-in",
        progressionKey: "majorTwoFiveOne",
      },
      rootNote: "D",
    });
  });

  it("does not notify subscribers when remembered session material creation is unchanged", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        sessionMaterialCreationDefaults: {
          rootNote: "D",
        },
      },
    });
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().rememberSessionMaterialCreation({
      rootNote: "D",
    });

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("clears remembered session material creation when restoring built-in defaults", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        sessionMaterialCreationDefaults: {
          chordListMode: "each-chord-once",
          materialKind: "chord-progression",
          noteCollectionKey: "minor",
          progression: {
            kind: "built-in",
            progressionKey: "majorTwoFiveOne",
          },
          rootNote: "D",
        },
      },
    });

    store.getState().rememberSessionMaterialCreation({
      chordListMode: "full-song-order",
      materialKind: "part",
      noteCollectionKey: "major",
      progression: {
        kind: "built-in",
        progressionKey: "oneOneFiveFive",
      },
      rootNote: "C",
    });

    expect(store.getState().dojoSettings).toEqual({});
  });
});
