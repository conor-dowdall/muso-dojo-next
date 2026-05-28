import { createStore } from "zustand/vanilla";
import { createAppStoreActions } from "@/stores/app-store/actions";
import { type AppStore } from "@/stores/app-store/types";
import { type ActiveNotes } from "@/types/instrument-active-note";
import {
  type AppStoreSnapshot,
  type FretboardInstrumentInstanceConfig,
} from "@/types/session";

export const sessionId = "session-1";
export const partId = "part-1";
export const moduleId = "module-1";

export const cMajorNotes = {
  c4: { midi: 60 },
  e4: { midi: 64 },
  g4: { midi: 67 },
} satisfies ActiveNotes;

export function createStoreSnapshot(
  instrumentPatch: Partial<FretboardInstrumentInstanceConfig> = {},
): AppStoreSnapshot {
  return {
    activeSessionId: sessionId,
    preferences: {},
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

export function createTestStore(snapshot = createStoreSnapshot()) {
  return createStore<AppStore>()((set, get) => ({
    ...snapshot,
    ...createAppStoreActions(set, get),
  }));
}

export function getTestInstrument(store: ReturnType<typeof createTestStore>) {
  const instrument =
    store.getState().sessions[sessionId]?.parts[0]?.modules[0]?.instrument;

  if (!instrument) {
    throw new Error("Expected the test instrument to exist");
  }

  return instrument;
}
