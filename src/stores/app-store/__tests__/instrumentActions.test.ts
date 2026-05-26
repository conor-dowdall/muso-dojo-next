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

  it("does not notify subscribers when active notes are equivalent", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
      }),
    );
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store
      .getState()
      .setInstrumentActiveNotes(sessionId, partId, moduleId, {
        c4: { midi: 60 },
        e4: { midi: 64 },
        g4: { midi: 67 },
      });

    unsubscribe();
    expect(notificationCount).toBe(0);
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

  it("does not notify subscribers when locking is requested without a snapshot", () => {
    const store = createTestStore();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store
      .getState()
      .setInstrumentActiveNotesLock(sessionId, partId, moduleId, true);

    unsubscribe();
    expect(notificationCount).toBe(0);
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
  });

  it("does not notify subscribers when the active-notes lock state is unchanged", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
        activeNotesLocked: true,
      }),
    );
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

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

    unsubscribe();
    expect(notificationCount).toBe(0);
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

  it("clears active-note lock state when settings change the generated note surface", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
        activeNotesLocked: true,
        activeNotesLockPreservesEdits: true,
      }),
    );

    store.getState().updateInstrumentSettings(sessionId, partId, moduleId, {
      config: {
        fretRange: [0, 7],
      },
    });

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockPreservesEdits",
    );
  });
});
