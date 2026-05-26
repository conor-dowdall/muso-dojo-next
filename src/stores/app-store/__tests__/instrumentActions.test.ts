import { describe, expect, it } from "vitest";
import {
  cMajorNotes,
  createStoreSnapshot,
  createTestStore,
  getTestInstrument,
  moduleId,
  partId,
  sessionId,
} from "./appStoreTestUtils";

describe("instrument app store actions", () => {
  it("stores custom active notes for an instrument module", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentActiveNotes(sessionId, partId, moduleId, cMajorNotes);

    expect(getTestInstrument(store).activeNotes).toEqual(cMajorNotes);
  });

  it("unlocks notes but keeps edits when the lock was preserving custom edits", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        true,
        cMajorNotes,
        true,
      );
    store
      .getState()
      .setInstrumentActiveNotesLock(sessionId, partId, moduleId, false);

    expect(getTestInstrument(store).activeNotes).toEqual(cMajorNotes);
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
  });

  it("unlocks notes and clears the snapshot when the lock was not preserving edits", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        true,
        cMajorNotes,
        false,
      );
    store
      .getState()
      .setInstrumentActiveNotesLock(sessionId, partId, moduleId, false);

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockPreservesEdits",
    );
  });

  it("clears stale lock metadata when active notes are cleared directly", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
        activeNotesLocked: true,
        activeNotesLockPreservesEdits: false,
      }),
    );

    store
      .getState()
      .setInstrumentActiveNotes(sessionId, partId, moduleId, undefined);

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockPreservesEdits",
    );
  });
});
