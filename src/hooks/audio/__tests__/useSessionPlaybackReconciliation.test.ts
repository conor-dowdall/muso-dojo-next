import { describe, expect, it } from "vitest";
import {
  cMajorNotes,
  createTestStore,
  moduleId,
  partId,
  sessionId,
} from "@/stores/app-store/__tests__/appStoreTestUtils";
import { createPlaybackModuleIdsSelector } from "@/hooks/audio/useSessionPlaybackReconciliation";

describe("createPlaybackModuleIdsSelector", () => {
  it("preserves its selection across unrelated active-note edits", () => {
    const store = createTestStore();
    const selectPlaybackModuleIds = createPlaybackModuleIdsSelector(sessionId);
    const before = selectPlaybackModuleIds(store.getState());

    store
      .getState()
      .setInstrumentActiveNotes(sessionId, partId, moduleId, cMajorNotes);

    expect(selectPlaybackModuleIds(store.getState())).toBe(before);
  });

  it("changes its selection when playback modules change", () => {
    const store = createTestStore();
    const selectPlaybackModuleIds = createPlaybackModuleIdsSelector(sessionId);
    const before = selectPlaybackModuleIds(store.getState());

    store.getState().addPartModule(sessionId, partId, {
      type: "exercise-looper",
    });

    const after = selectPlaybackModuleIds(store.getState());
    expect(after).not.toBe(before);
    expect(after.exercise).toHaveLength(1);
  });
});
