import { describe, expect, it } from "vitest";
import { createStoreSnapshot, createTestStore } from "./appStoreTestUtils";

describe("workspace app store actions", () => {
  it("stores the selected Arrangement view", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const otherArrangementId = store.getState().addArrangement();
    const lastModified =
      store.getState().arrangements[arrangementId]?.lastModified;

    store.getState().setArrangementWorkspaceViewMode(arrangementId, "chart");
    expect(
      store.getState().arrangements[arrangementId]?.workspaceViewMode,
    ).toBe("chart");
    expect(
      store.getState().arrangements[otherArrangementId]?.workspaceViewMode,
    ).toBe("build");
    expect(store.getState().arrangements[arrangementId]?.lastModified).toBe(
      lastModified,
    );

    store.getState().setArrangementWorkspaceViewMode(arrangementId, "build");
    expect(
      store.getState().arrangements[arrangementId]?.workspaceViewMode,
    ).toBe("build");
  });

  it("stores the selected view on one Session", () => {
    const store = createTestStore();
    const otherSessionId = store.getState().addSession();
    const lastModified = store.getState().sessions["session-1"]?.lastModified;

    expect(
      store.getState().setSessionWorkspaceViewMode("session-1", "chart"),
    ).toBe("chart");
    expect(store.getState().sessions["session-1"]?.workspaceViewMode).toBe(
      "chart",
    );
    expect(store.getState().sessions[otherSessionId]?.workspaceViewMode).toBe(
      "session",
    );
    expect(store.getState().sessions["session-1"]?.lastModified).toBe(
      lastModified,
    );

    expect(
      store.getState().setSessionWorkspaceViewMode("session-1", "session"),
    ).toBe("session");
    expect(store.getState().sessions["session-1"]?.workspaceViewMode).toBe(
      "session",
    );
  });

  it("retains a Session Chart preference while it has no Parts", () => {
    const snapshot = createStoreSnapshot();
    const activeSession = snapshot.sessions[snapshot.activeSessionId ?? ""];
    if (!activeSession) {
      throw new Error("Expected an active Session");
    }
    activeSession.parts = [];
    const store = createTestStore(snapshot);

    expect(
      store.getState().setSessionWorkspaceViewMode("session-1", "chart"),
    ).toBe("chart");
    expect(store.getState().sessions["session-1"]?.workspaceViewMode).toBe(
      "chart",
    );
  });

  it("does not notify subscribers when the selected view is unchanged", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setSessionWorkspaceViewMode("session-1", "session");
    store.getState().setArrangementWorkspaceViewMode(arrangementId, "build");

    unsubscribe();
    expect(notificationCount).toBe(0);
  });
});
