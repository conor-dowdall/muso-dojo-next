import { describe, expect, it } from "vitest";
import { getArrangementSectionSourceStatus } from "../arrangementSectionSource";
import {
  cMajorNotes,
  createTestStore,
  moduleId,
  partId,
  sessionId,
} from "@/stores/app-store/__tests__/appStoreTestUtils";

describe("Arrangement Section source status", () => {
  it("ignores Session metadata and tempo that an Arrangement does not use", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
    const section = store.getState().arrangements[arrangementId]!.sections[0]!;

    store.getState().setSessionTempoBpm(sessionId, 132);
    store.getState().renameSession(sessionId, "Renamed Session");
    store.getState().setSessionWorkspaceViewMode(sessionId, "chart");
    store
      .getState()
      .setInstrumentActiveNotes(sessionId, partId, moduleId, cMajorNotes);

    expect(
      getArrangementSectionSourceStatus(
        section,
        store.getState().sessions[sessionId],
      ),
    ).toBe("current");
  });

  it("detects Chart material and playback changes", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
    const section = store.getState().arrangements[arrangementId]!.sections[0]!;

    store.getState().setPartRootNote(sessionId, partId, "D");

    expect(
      getArrangementSectionSourceStatus(
        section,
        store.getState().sessions[sessionId],
      ),
    ).toBe("changed");
  });

  it("distinguishes unavailable and empty source Sessions", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
    const section = store.getState().arrangements[arrangementId]!.sections[0]!;
    const session = store.getState().sessions[sessionId]!;

    expect(getArrangementSectionSourceStatus(section, undefined)).toBe(
      "unavailable",
    );
    expect(
      getArrangementSectionSourceStatus(section, { ...session, parts: [] }),
    ).toBe("empty");
  });
});
