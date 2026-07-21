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

const cMajorSourceKey = '["C","major","guitar"]';
const dMajorSourceKey = '["D","major","guitar"]';
const ebMajorSourceKey = '["Eb","major","guitar"]';
const cMajorLockSnapshot = {
  activeNotes: cMajorNotes,
  sourceKey: cMajorSourceKey,
};

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

    store.getState().setInstrumentActiveNotes(sessionId, partId, moduleId, {
      c4: { midi: 60 },
      e4: { midi: 64 },
      g4: { midi: 67 },
    });

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("unlocks notes but keeps the snapshot for same-context editing", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        true,
        cMajorLockSnapshot,
      );
    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        false,
        undefined,
        cMajorSourceKey,
      );

    expect(getTestInstrument(store).activeNotes).toEqual(cMajorNotes);
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
  });

  it("clears the locked snapshot when unlocking in a different source context", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        true,
        cMajorLockSnapshot,
      );
    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        false,
        undefined,
        ebMajorSourceKey,
      );

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
  });

  it("keeps the frozen board through a root change while locked, then clears it on unlock", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        true,
        cMajorLockSnapshot,
      );
    store.getState().setPartRootNote(sessionId, partId, "D");

    expect(getTestInstrument(store).activeNotes).toEqual(cMajorNotes);
    expect(getTestInstrument(store).activeNotesLocked).toBe(true);
    expect(getTestInstrument(store).activeNotesLockSourceKey).toBe(
      cMajorSourceKey,
    );

    store
      .getState()
      .setInstrumentActiveNotesLock(
        sessionId,
        partId,
        moduleId,
        false,
        undefined,
        dMajorSourceKey,
      );

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
  });

  it("clears unlocked custom notes immediately when the part theory changes", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
      }),
    );

    store.getState().setPartNoteCollectionKey(sessionId, partId, "minor");

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
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
        activeNotesLockSourceKey: cMajorSourceKey,
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
        cMajorLockSnapshot,
      );

    unsubscribe();
    expect(notificationCount).toBe(0);
  });

  it("clears stale lock metadata when active notes are cleared directly", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
        activeNotesLocked: true,
        activeNotesLockSourceKey: cMajorSourceKey,
      }),
    );

    store
      .getState()
      .setInstrumentActiveNotes(sessionId, partId, moduleId, undefined);

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
  });

  it("clears active-note lock state when settings change the generated note surface", () => {
    const store = createTestStore(
      createStoreSnapshot({
        activeNotes: cMajorNotes,
        activeNotesLocked: true,
        activeNotesLockSourceKey: cMajorSourceKey,
      }),
    );

    store
      .getState()
      .updateFretboardInstrumentSettings(sessionId, partId, moduleId, {
        config: {
          fretRange: [0, 7],
        },
      });

    expect(getTestInstrument(store)).not.toHaveProperty("activeNotes");
    expect(getTestInstrument(store)).not.toHaveProperty("activeNotesLocked");
    expect(getTestInstrument(store)).not.toHaveProperty(
      "activeNotesLockSourceKey",
    );
  });

  it("stores and clears explicit fretboard appearance settings", () => {
    const store = createTestStore();

    store
      .getState()
      .updateFretboardInstrumentSettings(sessionId, partId, moduleId, {
        inlayPreset: "pawPrint",
        theme: "maple",
      });

    expect(getTestInstrument(store)).toMatchObject({
      inlayPreset: "pawPrint",
      theme: "maple",
    });

    store
      .getState()
      .updateFretboardInstrumentSettings(sessionId, partId, moduleId, {
        inlayPreset: undefined,
        theme: undefined,
      });

    expect(getTestInstrument(store)).not.toHaveProperty("inlayPreset");
    expect(getTestInstrument(store)).not.toHaveProperty("theme");
  });

  it("rejects settings intended for a different instrument type", () => {
    const store = createTestStore();
    const sessionsBefore = store.getState().sessions;

    store
      .getState()
      .updateKeyboardInstrumentSettings(sessionId, partId, moduleId, {
        range: "keys61",
        theme: "studio",
      });

    expect(store.getState().sessions).toBe(sessionsBefore);
    expect(getTestInstrument(store)).not.toHaveProperty("range");
    expect(getTestInstrument(store)).not.toHaveProperty("theme");
  });

  it("stores an instrument display size hint", () => {
    const store = createTestStore();

    store
      .getState()
      .setInstrumentDisplaySize(sessionId, partId, moduleId, "large");

    expect(getTestInstrument(store).layout).toEqual({ size: "large" });
  });

  it("removes the size hint when restoring the comfortable default", () => {
    const store = createTestStore(
      createStoreSnapshot({
        layout: { size: "compact" },
      }),
    );

    store
      .getState()
      .setInstrumentDisplaySize(sessionId, partId, moduleId, "comfortable");

    expect(getTestInstrument(store)).not.toHaveProperty("layout");
  });

  it("preserves advanced layout intent when changing display size", () => {
    const store = createTestStore(
      createStoreSnapshot({
        layout: { scale: 1.5, widthMode: "scroll" },
      }),
    );

    store
      .getState()
      .setInstrumentDisplaySize(sessionId, partId, moduleId, "compact");

    expect(getTestInstrument(store).layout).toEqual({
      size: "compact",
      scale: 1.5,
      widthMode: "scroll",
    });
  });

  it("does not notify subscribers when the display size is unchanged", () => {
    const store = createTestStore(
      createStoreSnapshot({
        layout: { size: "large" },
      }),
    );
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store
      .getState()
      .setInstrumentDisplaySize(sessionId, partId, moduleId, "large");

    unsubscribe();
    expect(notificationCount).toBe(0);
  });
});
