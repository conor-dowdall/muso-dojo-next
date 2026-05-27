import { describe, expect, it } from "vitest";
import {
  cMajorNotes,
  createStoreSnapshot,
  createTestStore,
  moduleId,
  partId,
  sessionId,
} from "./appStoreTestUtils";
import { type InstrumentInstanceConfig } from "@/types/session";

function createBatchSettingsSnapshot() {
  const snapshot = createStoreSnapshot({
    activeNotes: cMajorNotes,
    displayFormatId: "intervals",
    noteEmphasis: "small",
  });
  const session = snapshot.sessions[sessionId];

  if (!session) {
    throw new Error("Expected test session to exist");
  }

  session.parts.push({
    id: "part-2",
    rootNote: "D",
    noteCollectionKey: "minor",
    modules: [
      {
        id: "module-2",
        type: "instrument",
        instrument: {
          type: "keyboard",
          activeNotes: {
            d4: { midi: 62 },
          },
          activeNotesLocked: true,
          activeNotesLockSourceKey: '["D","minor","21,108"]',
          displayFormatId: "roman-triads",
        },
      },
    ],
  });

  return snapshot;
}

function getSessionInstruments(
  store: ReturnType<typeof createTestStore>,
): InstrumentInstanceConfig[] {
  return store
    .getState()
    .sessions[sessionId]?.parts.flatMap((part) =>
      part.modules.flatMap((partModule) =>
        partModule.type === "instrument" ? [partModule.instrument] : [],
      ),
    ) ?? [];
}

describe("session app store actions", () => {
  it("does not notify subscribers when the requested active session is unchanged or missing", () => {
    const store = createTestStore();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setActiveSessionId(sessionId);
    store.getState().setActiveSessionId("missing-session");

    unsubscribe();
    expect(notificationCount).toBe(0);
    expect(store.getState().activeSessionId).toBe(sessionId);
  });

  it("does not notify subscribers when removing a missing session", () => {
    const store = createTestStore();
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().removeSession("missing-session");

    unsubscribe();
    expect(notificationCount).toBe(0);
    expect(Object.keys(store.getState().sessions)).toEqual([sessionId]);
  });

  it("applies one display text setting to every instrument in a session", () => {
    const store = createTestStore(createBatchSettingsSnapshot());

    store.getState().setSessionDisplayFormatId(sessionId, "midi");

    expect(
      getSessionInstruments(store).map(
        (instrument) => instrument.displayFormatId ?? "note-names",
      ),
    ).toEqual(["midi", "midi"]);

    store.getState().setSessionDisplayFormatId(sessionId, "note-names");

    expect(
      getSessionInstruments(store).map((instrument) =>
        Object.hasOwn(instrument, "displayFormatId"),
      ),
    ).toEqual([false, false]);
  });

  it("applies one note size setting to every instrument in a session", () => {
    const store = createTestStore(createBatchSettingsSnapshot());

    store.getState().setSessionNoteEmphasis(sessionId, "hidden");

    expect(
      getSessionInstruments(store).map(
        (instrument) => instrument.noteEmphasis ?? "large",
      ),
    ).toEqual(["hidden", "hidden"]);

    store.getState().setSessionNoteEmphasis(sessionId, "large");

    expect(
      getSessionInstruments(store).map((instrument) =>
        Object.hasOwn(instrument, "noteEmphasis"),
      ),
    ).toEqual([false, false]);
  });

  it("applies one chord or scale to every part and clears only unlocked custom notes", () => {
    const store = createTestStore(createBatchSettingsSnapshot());

    store.getState().setSessionNoteCollectionKey(sessionId, "minor");

    const parts = store.getState().sessions[sessionId]?.parts ?? [];
    const firstInstrument = parts[0]?.modules.find(
      (partModule) => partModule.id === moduleId,
    );
    const secondInstrument = parts[1]?.modules[0];

    expect(parts.map((part) => part.noteCollectionKey)).toEqual([
      "minor",
      "minor",
    ]);
    expect(firstInstrument?.type).toBe("instrument");
    if (firstInstrument?.type === "instrument") {
      expect(firstInstrument.instrument).not.toHaveProperty("activeNotes");
    }
    expect(secondInstrument?.type).toBe("instrument");
    if (secondInstrument?.type === "instrument") {
      expect(secondInstrument.instrument.activeNotes).toEqual({
        d4: { midi: 62 },
      });
      expect(secondInstrument.instrument.activeNotesLocked).toBe(true);
    }
  });

  it("does not notify subscribers when session-wide settings already match", () => {
    const store = createTestStore(
      createStoreSnapshot({
        displayFormatId: "midi",
        noteEmphasis: "small",
      }),
    );
    let notificationCount = 0;
    const unsubscribe = store.subscribe(() => {
      notificationCount += 1;
    });

    store.getState().setSessionDisplayFormatId(sessionId, "midi");
    store.getState().setSessionNoteEmphasis(sessionId, "small");
    store.getState().setSessionNoteCollectionKey(sessionId, "major");

    unsubscribe();
    expect(notificationCount).toBe(0);
    expect(store.getState().sessions[sessionId]?.parts[0]?.id).toBe(partId);
  });
});
