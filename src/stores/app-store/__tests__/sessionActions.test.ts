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

  it("updates and clones the Session Backing Band", () => {
    const store = createTestStore();
    const backingBand = {
      countInBeats: 2,
      looper: {
        audioPresetId: "piano" as const,
        enabled: false,
        octaveOffset: 1,
      },
      rhythm: {
        mode: "custom" as const,
        selection: {
          recipe: {
            beats: 5,
            groove: "kit" as const,
            grouping: "auto" as const,
            timekeeper: {
              feel: "straight" as const,
              sound: "hat" as const,
              subdivision: "eighth" as const,
            },
          },
          source: "recipe" as const,
        },
      },
    };

    store.getState().setSessionBackingBand(sessionId, backingBand);
    const cloneId = store.getState().cloneSession(sessionId);

    expect(store.getState().sessions[sessionId]?.backingBand).toEqual(
      backingBand,
    );
    expect(cloneId).toBeDefined();
    expect(
      cloneId ? store.getState().sessions[cloneId]?.backingBand : undefined,
    ).toEqual(backingBand);
  });
});
