import { describe, expect, it } from "vitest";
import { createStoreSnapshot, createTestStore } from "./appStoreTestUtils";

describe("workspace app store actions", () => {
  it("stores the selected available Session view", () => {
    const store = createTestStore();

    expect(store.getState().setSessionWorkspaceViewMode("chart")).toBe(
      "chart",
    );
    expect(store.getState().sessionWorkspaceViewMode).toBe("chart");

    expect(store.getState().setSessionWorkspaceViewMode("session")).toBe(
      "session",
    );
    expect(store.getState().sessionWorkspaceViewMode).toBe("session");
  });

  it("falls back to Session when the active Session has no Parts", () => {
    const snapshot = createStoreSnapshot();
    const activeSession = snapshot.sessions[snapshot.activeSessionId ?? ""];
    if (!activeSession) {
      throw new Error("Expected an active Session");
    }
    activeSession.parts = [];
    const store = createTestStore(snapshot);

    expect(store.getState().setSessionWorkspaceViewMode("chart")).toBe(
      "session",
    );
    expect(store.getState().sessionWorkspaceViewMode).toBe("session");
  });

  it("does not notify subscribers when the selected view is unchanged", () => {
    const store = createTestStore();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setSessionWorkspaceViewMode("session");

    unsubscribe();
    expect(notificationCount).toBe(0);
  });
});
