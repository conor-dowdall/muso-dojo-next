import { describe, expect, it } from "vitest";
import { createTestStore, sessionId } from "./appStoreTestUtils";

describe("arrangement app store actions", () => {
  it("creates, captures, reuses, and removes owned Sections", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();

    expect(store.getState().activeWorkspace).toEqual({
      kind: "arrangement",
      id: arrangementId,
    });
    expect(store.getState().arrangements[arrangementId]).toMatchObject({
      name: "My Arrangement",
      playbackMode: "once",
      tempoBpm: 80,
    });

    store.getState().setSessionTempoBpm(sessionId, 112);
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId);
    expect(capture).toBeDefined();
    const arrangement = store.getState().arrangements[arrangementId]!;
    expect(arrangement.tempoBpm).toBe(112);
    expect(arrangement.sections).toHaveLength(1);
    expect(arrangement.entries).toHaveLength(1);
    expect(arrangement.sections[0]?.parts[0]?.id).not.toBe(
      store.getState().sessions[sessionId]?.parts[0]?.id,
    );

    const secondEntryId = store
      .getState()
      .appendArrangementSectionEntry(arrangementId, capture!.sectionId);
    expect(secondEntryId).toBeDefined();
    expect(store.getState().arrangements[arrangementId]?.sections).toHaveLength(
      1,
    );
    expect(store.getState().arrangements[arrangementId]?.entries).toHaveLength(
      2,
    );

    store.getState().removeArrangementEntry(arrangementId, capture!.entryId);
    expect(store.getState().arrangements[arrangementId]?.sections).toHaveLength(
      1,
    );
    store.getState().removeArrangementEntry(arrangementId, secondEntryId!);
    expect(store.getState().arrangements[arrangementId]).toMatchObject({
      entries: [],
      sections: [],
    });
  });

  it("duplicates every owned identity while retaining shared Section references", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId)!;
    store
      .getState()
      .appendArrangementSectionEntry(arrangementId, capture.sectionId);

    const cloneId = store.getState().cloneArrangement(arrangementId)!;
    const source = store.getState().arrangements[arrangementId]!;
    const clone = store.getState().arrangements[cloneId]!;

    expect(clone.id).not.toBe(source.id);
    expect(clone.sections[0]?.id).not.toBe(source.sections[0]?.id);
    expect(clone.sections[0]?.parts[0]?.id).not.toBe(
      source.sections[0]?.parts[0]?.id,
    );
    expect(new Set(clone.entries.map(({ id }) => id)).size).toBe(2);
    expect(new Set(clone.entries.map(({ sectionId }) => sectionId)).size).toBe(
      1,
    );
  });

  it("preserves Entry selection identities across edits and clamps invalid requests", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId)!;
    const secondId = store
      .getState()
      .cloneArrangementEntry(arrangementId, capture.entryId)!;

    store.getState().setArrangementEntryPlayCount(arrangementId, secondId, 3);
    store.getState().moveArrangementEntry(arrangementId, secondId, "earlier");
    expect(store.getState().arrangements[arrangementId]?.entries).toMatchObject(
      [
        { id: secondId, playCount: 3 },
        { id: capture.entryId, playCount: 1 },
      ],
    );

    store.getState().setArrangementEntryPlayCount(arrangementId, secondId, 100);
    expect(
      store
        .getState()
        .arrangements[arrangementId]?.entries.find(({ id }) => id === secondId)
        ?.playCount,
    ).toBe(3);
  });
});
