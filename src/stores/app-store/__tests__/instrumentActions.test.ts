import { describe, expect, it } from "vitest";
import { createStore } from "zustand/vanilla";
import { createAppStoreActions } from "@/stores/app-store/actions";
import { type AppStore } from "@/stores/app-store/types";
import { type ActiveNotes } from "@/types/instrument-active-note";
import {
  type AppStoreSnapshot,
  type FretboardInstrumentInstanceConfig,
} from "@/types/session";

const sessionId = "session-1";
const partId = "part-1";
const moduleId = "module-1";

const cMajorNotes = {
  c4: { midi: 60 },
  e4: { midi: 64 },
  g4: { midi: 67 },
} satisfies ActiveNotes;

function createStoreSnapshot(
  instrumentPatch: Partial<FretboardInstrumentInstanceConfig> = {},
): AppStoreSnapshot {
  return {
    activeSessionId: sessionId,
    sessions: {
      [sessionId]: {
        id: sessionId,
        name: "Store Test Session",
        lastModified: "2026-01-01T00:00:00.000Z",
        parts: [
          {
            id: partId,
            rootNote: "C",
            noteCollectionKey: "major",
            modules: [
              {
                id: moduleId,
                type: "instrument",
                instrument: {
                  type: "fretboard",
                  ...instrumentPatch,
                },
              },
            ],
          },
        ],
      },
    },
  };
}

function createTestStore(snapshot = createStoreSnapshot()) {
  return createStore<AppStore>()((set, get) => ({
    ...snapshot,
    ...createAppStoreActions(set, get),
  }));
}

function getTestInstrument(store: ReturnType<typeof createTestStore>) {
  const instrument =
    store.getState().sessions[sessionId]?.parts[0]?.modules[0]?.instrument;

  if (!instrument) {
    throw new Error("Expected the test instrument to exist");
  }

  return instrument;
}

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
});
