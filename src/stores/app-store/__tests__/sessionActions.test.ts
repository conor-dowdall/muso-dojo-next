import { describe, expect, it } from "vitest";
import {
  createStoreSnapshot,
  createTestStore,
  sessionId,
} from "./appStoreTestUtils";
import { type SessionConfig } from "@/types/session";

const musoDojoNoteColors = {
  source: "preset",
  preset: "musoDojo",
} as const;

describe("session app store actions", () => {
  it("stores default note colors for new sessions", () => {
    const store = createTestStore();

    store.getState().setDefaultSessionNoteColorConfig(musoDojoNoteColors);

    expect(store.getState().preferences.defaultSessionNoteColorConfig).toEqual(
      musoDojoNoteColors,
    );
  });

  it("clears the stored note color default when choosing the built-in default", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      preferences: {
        defaultSessionNoteColorConfig: musoDojoNoteColors,
      },
    });

    store.getState().setDefaultSessionNoteColorConfig({ source: "theme" });

    expect(store.getState().preferences).toEqual({});
  });

  it("applies default note colors to newly created sessions only", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      preferences: {
        defaultSessionNoteColorConfig: musoDojoNoteColors,
      },
    });
    const existingSession = store.getState().sessions[sessionId];

    const newSessionId = store.getState().addSession({ name: "Practice" });

    expect(store.getState().sessions[newSessionId]?.noteColorConfig).toEqual(
      musoDojoNoteColors,
    );
    expect(store.getState().sessions[sessionId]).toBe(existingSession);
    expect(store.getState().sessions[sessionId]).not.toHaveProperty(
      "noteColorConfig",
    );
  });

  it("keeps cloned and imported session note colors independent of the default", () => {
    const store = createTestStore({
      ...createStoreSnapshot(),
      preferences: {
        defaultSessionNoteColorConfig: musoDojoNoteColors,
      },
    });
    const importedSession = {
      id: "imported-session",
      name: "Imported Session",
      lastModified: "2026-01-02T00:00:00.000Z",
      noteColorConfig: { source: "theme" },
      parts: [],
    } satisfies SessionConfig;

    const clonedSessionId = store.getState().cloneSession(sessionId);
    const importedSessionId = store.getState().importSession(importedSession);

    expect(
      clonedSessionId
        ? store.getState().sessions[clonedSessionId]?.noteColorConfig
        : undefined,
    ).toBeUndefined();
    expect(
      store.getState().sessions[importedSessionId]?.noteColorConfig,
    ).toEqual({ source: "theme" });
  });

  it("stores remembered keyboard and fretboard creation setups", () => {
    const store = createTestStore();

    store.getState().setInstrumentCreationDefault("keyboard", {
      theme: "studio",
    });
    store.getState().setInstrumentCreationDefault("fretboard", {
      instrument: "guitar",
      tuningKey: "guitarDropD",
      handedness: "left",
      appearanceSource: "custom",
      theme: "maple",
      inlayPreset: "dots",
    });

    expect(store.getState().preferences.instrumentCreationDefaults).toEqual({
      keyboard: {
        theme: "studio",
      },
      fretboard: {
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
      preferences: {
        instrumentCreationDefaults: {
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

    store.getState().setInstrumentCreationDefault("keyboard", {
      theme: "studio",
    });

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("does not notify subscribers when the requested active session is unchanged or missing", () => {
    const store = createTestStore();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setActiveSessionId(sessionId);
    store.getState().setActiveSessionId("missing-session");

    unsubscribe();
    expect(notificationCount).toBe(0);
    expect(store.getState().activeSessionId).toBe(sessionId);
  });

  it("does not notify subscribers when removing a missing session", () => {
    const store = createTestStore();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().removeSession("missing-session");

    unsubscribe();
    expect(notificationCount).toBe(0);
    expect(Object.keys(store.getState().sessions)).toEqual([sessionId]);
  });
});
