import { describe, expect, it } from "vitest";
import {
  createStoreSnapshot,
  createTestStore,
  sessionId,
} from "./appStoreTestUtils";
import { createBuiltInDefaultInstrumentSetup } from "@/utils/instrument-creation/defaultInstrumentSetup";

const musoDojoNoteColors = {
  source: "preset",
  preset: "musoDojo",
} as const;

describe("dojo settings app store actions", () => {
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

  it("stores the selected reverb setting", () => {
    const store = createTestStore();

    store.getState().setMasterAmbiencePresetId("warm-hall");

    expect(store.getState().dojoSettings.masterAmbiencePresetId).toBe(
      "warm-hall",
    );
  });

  it("clears the stored reverb setting when using the built-in default", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        masterAmbiencePresetId: "dry",
      },
    });

    store.getState().setMasterAmbiencePresetId("studio-room");

    expect(store.getState().dojoSettings).toEqual({});
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

  it("stores one remembered instrument creation setup", () => {
    const store = createTestStore();

    store.getState().setDefaultInstrumentSetup({
      instrumentType: "keyboard",
      setup: {
        theme: "studio",
      },
    });
    store.getState().setDefaultInstrumentSetup({
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

    expect(store.getState().dojoSettings.defaultInstrumentSetup).toEqual({
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

  it("does not notify subscribers when remembering an unchanged setup", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        defaultInstrumentSetup: {
          instrumentType: "keyboard",
          setup: {
            theme: "studio",
          },
        },
      },
    });
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setDefaultInstrumentSetup({
      instrumentType: "keyboard",
      setup: {
        theme: "studio",
      },
    });

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("clears remembered instrument setup when restoring the built-in default", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      dojoSettings: {
        defaultInstrumentSetup: {
          instrumentType: "keyboard",
          setup: {
            theme: "studio",
          },
        },
      },
    });

    store
      .getState()
      .setDefaultInstrumentSetup(createBuiltInDefaultInstrumentSetup());

    expect(store.getState().dojoSettings).toEqual({});
  });
});
