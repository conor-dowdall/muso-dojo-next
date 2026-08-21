import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestStore, partId, sessionId } from "./appStoreTestUtils";

describe("arrangement app store actions", () => {
  afterEach(() => vi.useRealTimers());

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
      ending: {
        audioPresetId: "acoustic-bass",
        octaveOffset: -1,
        rootNote: "C",
      },
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
    store.getState().setArrangementWorkspaceViewMode(arrangementId, "chart");
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId)!;
    store
      .getState()
      .appendArrangementSectionEntry(arrangementId, capture.sectionId);
    store.getState().setArrangementEnding(arrangementId, {
      audioPresetId: "piano",
      octaveOffset: 0,
      rootNote: "G",
    });

    const cloneId = store.getState().cloneArrangement(arrangementId)!;
    const source = store.getState().arrangements[arrangementId]!;
    const clone = store.getState().arrangements[cloneId]!;

    expect(clone.id).not.toBe(source.id);
    expect(source.workspaceViewMode).toBe("chart");
    expect(clone.workspaceViewMode).toBe("build");
    expect(clone.sections[0]?.id).not.toBe(source.sections[0]?.id);
    expect(clone.sections[0]?.parts[0]?.id).not.toBe(
      source.sections[0]?.parts[0]?.id,
    );
    expect(new Set(clone.entries.map(({ id }) => id)).size).toBe(2);
    expect(new Set(clone.entries.map(({ sectionId }) => sectionId)).size).toBe(
      1,
    );
    expect(clone.ending).toEqual(source.ending);
  });

  it("enables a default Ending and stores or removes independent changes", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const ending = {
      audioPresetId: "acoustic-bass" as const,
      octaveOffset: -1,
      rootNote: "D" as const,
    };

    expect(store.getState().arrangements[arrangementId]?.ending).toEqual({
      audioPresetId: "acoustic-bass",
      octaveOffset: -1,
      rootNote: "C",
    });
    store.getState().setArrangementEnding(arrangementId, ending);
    expect(store.getState().arrangements[arrangementId]?.ending).toEqual(
      ending,
    );
    store.getState().setArrangementEnding(arrangementId, undefined);
    expect(store.getState().arrangements[arrangementId]).not.toHaveProperty(
      "ending",
    );
  });

  it("infers the untouched default Ending from the first captured Section", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();

    store.getState().setPartRootNote(sessionId, partId, "D");
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);

    expect(store.getState().arrangements[arrangementId]?.ending).toEqual({
      audioPresetId: "acoustic-bass",
      octaveOffset: -1,
      rootNote: "D",
    });
  });

  it("does not re-enable or replace an Ending chosen before the first capture", () => {
    const store = createTestStore();
    const offArrangementId = store.getState().addArrangement();
    const customArrangementId = store.getState().addArrangement();
    const customEnding = {
      audioPresetId: "piano" as const,
      octaveOffset: 1,
      rootNote: "F" as const,
    };

    store.getState().setArrangementEnding(offArrangementId, undefined);
    store.getState().setArrangementEnding(customArrangementId, customEnding);
    store.getState().setPartRootNote(sessionId, partId, "D");
    store
      .getState()
      .addArrangementSectionFromSession(offArrangementId, sessionId);
    store
      .getState()
      .addArrangementSectionFromSession(customArrangementId, sessionId);

    expect(store.getState().arrangements[offArrangementId]).not.toHaveProperty(
      "ending",
    );
    expect(store.getState().arrangements[customArrangementId]?.ending).toEqual(
      customEnding,
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

    store.getState().setArrangementEntryPlayCount(arrangementId, secondId, 16);
    store.getState().setArrangementEntryPlayCount(arrangementId, secondId, 17);
    expect(
      store
        .getState()
        .arrangements[arrangementId]?.entries.find(({ id }) => id === secondId)
        ?.playCount,
    ).toBe(16);
  });

  it("duplicates a Section with independent content and copied Entry settings", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId)!;
    store
      .getState()
      .setArrangementEntryPlayCount(arrangementId, capture.entryId, 3);
    store
      .getState()
      .setArrangementEntryTempoOverrideBpm(arrangementId, capture.entryId, 120);

    const duplicateEntryId = store
      .getState()
      .cloneArrangementEntry(arrangementId, capture.entryId)!;
    const duplicatedArrangement = store.getState().arrangements[arrangementId]!;
    const duplicateEntry = duplicatedArrangement.entries.find(
      ({ id }) => id === duplicateEntryId,
    )!;
    const sourceSection = duplicatedArrangement.sections.find(
      ({ id }) => id === capture.sectionId,
    )!;
    const duplicateSection = duplicatedArrangement.sections.find(
      ({ id }) => id === duplicateEntry.sectionId,
    )!;

    expect(duplicatedArrangement.entries).toMatchObject([
      {
        id: capture.entryId,
        playCount: 3,
        sectionId: capture.sectionId,
        tempoOverrideBpm: 120,
      },
      {
        id: duplicateEntryId,
        playCount: 3,
        sectionId: duplicateSection.id,
        tempoOverrideBpm: 120,
      },
    ]);
    expect(duplicateSection.id).not.toBe(sourceSection.id);
    expect(duplicateSection.parts[0]?.id).not.toBe(sourceSection.parts[0]?.id);
    expect(duplicateSection.parts[0]?.modules[0]?.id).not.toBe(
      sourceSection.parts[0]?.modules[0]?.id,
    );

    store.getState().setPartRootNote(sessionId, partId, "D");
    expect(
      store
        .getState()
        .replaceArrangementSectionFromSession(
          arrangementId,
          duplicateSection.id,
          sessionId,
        ),
    ).toBe(true);

    expect(
      store
        .getState()
        .arrangements[arrangementId]?.sections.map(
          (section) => section.parts[0]?.rootNote,
        ),
    ).toEqual(["C", "D"]);
  });

  it("refreshes a shared Section snapshot without changing its Arrangement structure", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId)!;
    const repeatedEntryId = store
      .getState()
      .appendArrangementSectionEntry(arrangementId, capture.sectionId)!;

    store
      .getState()
      .setArrangementEntryPlayCount(arrangementId, repeatedEntryId, 3);
    store.getState().setArrangementTempoBpm(arrangementId, 96);
    store.getState().setArrangementPlaybackMode(arrangementId, "loop");

    const capturedSection =
      store.getState().arrangements[arrangementId]!.sections[0]!;
    const capturedPartId = capturedSection.parts[0]!.id;
    const entrySnapshot = store.getState().arrangements[arrangementId]!.entries;

    store.getState().updatePartSettings(sessionId, partId, { rootNote: "D" });
    store.getState().renameSession(sessionId, "Updated Source Session");
    const updatedSession = store.getState().sessions[sessionId]!;

    expect(updatedSession.lastModified).not.toBe(
      capturedSection.source.sessionLastModified,
    );
    expect(
      store
        .getState()
        .replaceArrangementSectionFromSession(
          arrangementId,
          capture.sectionId,
          sessionId,
        ),
    ).toBe(true);

    const refreshedArrangement = store.getState().arrangements[arrangementId]!;
    const refreshedSection = refreshedArrangement.sections[0]!;

    expect(refreshedArrangement).toMatchObject({
      playbackMode: "loop",
      tempoBpm: 96,
      entries: [
        { id: capture.entryId, sectionId: capture.sectionId, playCount: 1 },
        { id: repeatedEntryId, sectionId: capture.sectionId, playCount: 3 },
      ],
    });
    expect(refreshedArrangement.entries).toEqual(entrySnapshot);
    expect(refreshedSection.id).toBe(capture.sectionId);
    expect(refreshedSection.source).toMatchObject({
      sessionId,
      sessionName: "Updated Source Session",
      sessionLastModified: updatedSession.lastModified,
    });
    expect(refreshedSection.parts[0]).toMatchObject({ rootNote: "D" });
    expect(refreshedSection.parts[0]?.id).not.toBe(capturedPartId);
    expect(refreshedSection.parts[0]?.id).not.toBe(updatedSession.parts[0]?.id);
  });

  it("updates every changed Section snapshot explicitly without changing Arrangement entries", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
    const entries = store.getState().arrangements[arrangementId]!.entries;

    store.getState().setPartRootNote(sessionId, partId, "D");

    expect(
      store.getState().updateChangedArrangementSections(arrangementId),
    ).toBe(2);
    const arrangement = store.getState().arrangements[arrangementId]!;
    expect(arrangement.entries).toEqual(entries);
    expect(
      arrangement.sections.map((section) => section.parts[0]?.rootNote),
    ).toEqual(["D", "D"]);
    expect(
      store.getState().updateChangedArrangementSections(arrangementId),
    ).toBe(0);
  });

  it("keeps captured Sections intact when their source Session is deleted", () => {
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    store.getState().addArrangementSectionFromSession(arrangementId, sessionId);
    const capturedSections =
      store.getState().arrangements[arrangementId]!.sections;

    store.getState().removeSession(sessionId);

    expect(store.getState().sessions[sessionId]).toBeUndefined();
    expect(store.getState().arrangements[arrangementId]?.sections).toEqual(
      capturedSections,
    );
  });

  it("stores strict independent Entry tempo overrides and preserves them through copies and refreshes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T10:00:00.000Z"));
    const store = createTestStore();
    const arrangementId = store.getState().addArrangement();
    const capture = store
      .getState()
      .addArrangementSectionFromSession(arrangementId, sessionId)!;
    const initial = store.getState().arrangements[arrangementId]!;

    expect(initial.entries[0]).not.toHaveProperty("tempoOverrideBpm");
    vi.setSystemTime(new Date("2026-08-14T10:01:00.000Z"));
    store
      .getState()
      .setArrangementEntryTempoOverrideBpm(
        arrangementId,
        capture.entryId,
        initial.tempoBpm,
      );
    const overridden = store.getState().arrangements[arrangementId]!;
    expect(overridden.entries[0]?.tempoOverrideBpm).toBe(initial.tempoBpm);
    expect(overridden.lastModified).not.toBe(initial.lastModified);

    store.getState().setArrangementTempoBpm(arrangementId, 135);
    expect(
      store.getState().arrangements[arrangementId]?.entries[0]
        ?.tempoOverrideBpm,
    ).toBe(initial.tempoBpm);

    const duplicateId = store
      .getState()
      .cloneArrangementEntry(arrangementId, capture.entryId)!;
    store
      .getState()
      .setArrangementEntryTempoOverrideBpm(arrangementId, duplicateId, 160);
    expect(
      store
        .getState()
        .arrangements[arrangementId]?.entries.map(
          ({ tempoOverrideBpm }) => tempoOverrideBpm,
        ),
    ).toEqual([initial.tempoBpm, 160]);

    const beforeInvalid = store.getState().arrangements[arrangementId]!;
    store
      .getState()
      .setArrangementEntryTempoOverrideBpm(arrangementId, duplicateId, 160.5);
    store
      .getState()
      .setArrangementEntryTempoOverrideBpm(arrangementId, "missing", 120);
    expect(store.getState().arrangements[arrangementId]).toBe(beforeInvalid);

    store
      .getState()
      .replaceArrangementSectionFromSession(
        arrangementId,
        capture.sectionId,
        sessionId,
      );
    expect(
      store
        .getState()
        .arrangements[arrangementId]?.entries.map(
          ({ tempoOverrideBpm }) => tempoOverrideBpm,
        ),
    ).toEqual([initial.tempoBpm, 160]);

    const cloneId = store.getState().cloneArrangement(arrangementId)!;
    expect(
      store
        .getState()
        .arrangements[cloneId]?.entries.map(
          ({ tempoOverrideBpm }) => tempoOverrideBpm,
        ),
    ).toEqual([initial.tempoBpm, 160]);

    store
      .getState()
      .setArrangementEntryTempoOverrideBpm(
        arrangementId,
        capture.entryId,
        undefined,
      );
    expect(
      store.getState().arrangements[arrangementId]?.entries[0],
    ).not.toHaveProperty("tempoOverrideBpm");
  });
});
