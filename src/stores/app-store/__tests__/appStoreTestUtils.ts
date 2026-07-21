import { createAppStore } from "@/stores/app-store/storeInitializer";
import { type ActiveNotes } from "@/types/instrument-active-note";
import {
  type AppStoreSnapshot,
  type FretboardInstrumentInstanceConfig,
} from "@/types/session";
import { isInstrumentPartModule } from "@/utils/session/partModuleTypes";

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
    dojoSettings: {},
    sessionWorkspaceViewMode: "session",
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
  return createAppStore(snapshot);
}

export function getTestInstrument(store: ReturnType<typeof createTestStore>) {
  const partModule = store.getState().sessions[sessionId]?.parts[0]?.modules[0];

  if (!isInstrumentPartModule(partModule)) {
    throw new Error("Expected the test instrument to exist");
  }

  return partModule.instrument;
}
