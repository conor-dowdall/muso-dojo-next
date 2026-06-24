import { describe, expect, it } from "vitest";
import { createTestStore, sessionId } from "./appStoreTestUtils";

describe("session app store actions", () => {
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

  it("updates the persisted session tempo", () => {
    const store = createTestStore();

    store.getState().setSessionTempoBpm(sessionId, 132);

    expect(store.getState().sessions[sessionId]).toMatchObject({
      tempoBpm: 132,
    });
  });

  it("updates persisted Practice Band settings without an enable step", () => {
    const store = createTestStore();

    store.getState().updatePracticeBandSettings(sessionId, {
      audioPresetId: "piano",
      drums: false,
      octaveOffset: 0,
    });

    expect(store.getState().sessions[sessionId]?.practiceBand).toEqual({
      audioPresetId: "piano",
      drums: false,
      octaveOffset: 0,
    });

    store.getState().updatePracticeBandSettings(sessionId, {
      drums: true,
    });

    expect(store.getState().sessions[sessionId]?.practiceBand).toEqual({
      audioPresetId: "piano",
      octaveOffset: 0,
    });
  });

  it("removes Practice Band settings when they return to defaults", () => {
    const store = createTestStore();

    store.getState().updatePracticeBandSettings(sessionId, {
      drums: false,
    });
    store.getState().updatePracticeBandSettings(sessionId, {
      drums: true,
    });

    expect(store.getState().sessions[sessionId]).not.toHaveProperty(
      "practiceBand",
    );
  });
});
