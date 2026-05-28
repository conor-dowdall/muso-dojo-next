import { describe, expect, it } from "vitest";
import { type AppStoreSnapshot } from "@/types/session";
import { createTestStore, partId, sessionId } from "./appStoreTestUtils";

function getPartInstruments(
  store: ReturnType<typeof createTestStore>,
  targetPartId: string,
) {
  const part = store
    .getState()
    .sessions[sessionId]?.parts.find((part) => part.id === targetPartId);

  if (!part) {
    throw new Error(`Expected ${targetPartId} to exist`);
  }

  return part.modules.map((module) => module.instrument);
}

function createMultiPartSnapshot() {
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
                id: "module-1",
                type: "instrument",
                instrument: {
                  type: "fretboard",
                  displayFormatId: "note-names",
                  noteEmphasis: "large",
                },
              },
              {
                id: "module-2",
                type: "instrument",
                instrument: {
                  type: "keyboard",
                  displayFormatId: "midi",
                  noteEmphasis: "small",
                },
              },
            ],
          },
          {
            id: "part-2",
            rootNote: "D",
            noteCollectionKey: "minor",
            modules: [
              {
                id: "module-3",
                type: "instrument",
                instrument: {
                  type: "fretboard",
                  displayFormatId: "intervals",
                  noteEmphasis: "large",
                },
              },
            ],
          },
          {
            id: "part-empty",
            rootNote: "E",
            noteCollectionKey: "major",
            modules: [],
          },
        ],
      },
    },
  } satisfies AppStoreSnapshot;
}

describe("part app store actions", () => {
  it("sets display text for all instruments in the target part only", () => {
    const store = createTestStore(createMultiPartSnapshot());

    store.getState().setPartDisplayFormatId(sessionId, partId, "roman-triads");

    expect(
      getPartInstruments(store, partId).map(
        (instrument) => instrument.displayFormatId,
      ),
    ).toStrictEqual(["roman-triads", "roman-triads"]);
    expect(
      getPartInstruments(store, "part-2").map(
        (instrument) => instrument.displayFormatId,
      ),
    ).toStrictEqual(["intervals"]);
  });

  it("sets note size for all instruments in the target part only", () => {
    const store = createTestStore(createMultiPartSnapshot());

    store.getState().setPartNoteEmphasis(sessionId, partId, "hidden");

    expect(
      getPartInstruments(store, partId).map(
        (instrument) => instrument.noteEmphasis ?? "large",
      ),
    ).toStrictEqual(["hidden", "hidden"]);
    expect(
      getPartInstruments(store, "part-2").map(
        (instrument) => instrument.noteEmphasis ?? "large",
      ),
    ).toStrictEqual(["large"]);
  });

  it("leaves state stable for missing parts and parts with no instruments", () => {
    const store = createTestStore(createMultiPartSnapshot());
    const initialSession = store.getState().sessions[sessionId];

    store
      .getState()
      .setPartDisplayFormatId(sessionId, "part-missing", "roman-triads");
    store.getState().setPartNoteEmphasis(sessionId, "part-empty", "small");

    expect(store.getState().sessions[sessionId]).toBe(initialSession);
  });
});
