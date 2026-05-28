import { createDefaultSessionConfig } from "@/utils/session/createSessionEntities";
import {
  createUniqueSessionName,
  normalizeSessionNameForComparison,
} from "./entityIds";
import { cloneSessionConfig } from "./cloneConfig";
import { createImportedSessionConfig } from "./sessionImport";
import { updateSessionById } from "./sessionGraph";
import {
  type AppStoreGet,
  type AppStoreSet,
  type SessionActions,
} from "./types";
import {
  clearActiveNotesAffectedByPartTheory,
  normalizeInstrumentForWrite,
} from "./writeNormalization";
import { type DisplayFormatId } from "@/data/displayFormats";
import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import {
  type InstrumentInstanceConfig,
  type SessionConfig,
} from "@/types/session";
import { isInstrumentPartModule } from "@/utils/session/partModuleTypes";

function updateSessionInstruments(
  session: SessionConfig,
  updater: (
    instrument: InstrumentInstanceConfig,
  ) => InstrumentInstanceConfig | undefined,
) {
  let sessionChanged = false;
  const parts = session.parts.map((part) => {
    let partChanged = false;
    const modules = part.modules.map((partModule) => {
      if (!isInstrumentPartModule(partModule)) {
        return partModule;
      }

      const nextInstrument = updater(partModule.instrument);

      if (nextInstrument === undefined) {
        return partModule;
      }

      partChanged = true;
      return {
        ...partModule,
        instrument: nextInstrument,
      };
    });

    if (!partChanged) {
      return part;
    }

    sessionChanged = true;
    return {
      ...part,
      modules,
    };
  });

  return sessionChanged
    ? {
        ...session,
        parts,
      }
    : undefined;
}

function setInstrumentDisplayFormat(
  instrument: InstrumentInstanceConfig,
  displayFormatId: DisplayFormatId,
) {
  const currentDisplayFormatId = instrument.displayFormatId ?? "note-names";

  return currentDisplayFormatId === displayFormatId
    ? undefined
    : normalizeInstrumentForWrite({
        ...instrument,
        displayFormatId,
      });
}

function setInstrumentNoteEmphasis(
  instrument: InstrumentInstanceConfig,
  noteEmphasis: InstrumentNoteEmphasis,
) {
  const currentNoteEmphasis = instrument.noteEmphasis ?? "large";

  return currentNoteEmphasis === noteEmphasis
    ? undefined
    : normalizeInstrumentForWrite({
        ...instrument,
        noteEmphasis,
      });
}

export function createSessionActions(
  set: AppStoreSet,
  get: AppStoreGet,
): SessionActions {
  return {
    setActiveSessionId: (sessionId) => {
      const state = get();

      if (state.activeSessionId === sessionId || !state.sessions[sessionId]) {
        return;
      }

      set({ activeSessionId: sessionId });
    },
    addSession: (settings) => {
      const defaultSessionNoteColorConfig =
        get().preferences.defaultSessionNoteColorConfig;
      const session = createDefaultSessionConfig({
        ...settings,
        ...(defaultSessionNoteColorConfig
          ? { noteColorConfig: defaultSessionNoteColorConfig }
          : {}),
        name: createUniqueSessionName(
          settings?.name,
          Object.values(get().sessions).map((session) => session.name),
        ),
      });

      set((state) => ({
        activeSessionId: session.id,
        sessions: {
          ...state.sessions,
          [session.id]: session,
        },
      }));

      return session.id;
    },
    importSession: (session) => {
      const importedSession = createImportedSessionConfig(
        session,
        get().sessions,
      );

      set((state) => ({
        activeSessionId: importedSession.id,
        sessions: {
          ...state.sessions,
          [importedSession.id]: importedSession,
        },
      }));

      return importedSession.id;
    },
    cloneSession: (sessionId) => {
      const session = get().sessions[sessionId];

      if (!session) {
        return undefined;
      }

      const clonedSession = cloneSessionConfig(
        session,
        Object.keys(get().sessions),
        Object.values(get().sessions).map((session) => session.name),
      );

      set((state) => ({
        activeSessionId: clonedSession.id,
        sessions: {
          ...state.sessions,
          [clonedSession.id]: clonedSession,
        },
      }));

      return clonedSession.id;
    },
    removeSession: (sessionId) => {
      if (!get().sessions[sessionId]) {
        return;
      }

      set((state) => {
        const nextSessions = { ...state.sessions };
        delete nextSessions[sessionId];
        const replacementSession = Object.values(nextSessions)[0];

        return {
          activeSessionId:
            state.activeSessionId === sessionId
              ? (replacementSession?.id ?? null)
              : state.activeSessionId,
          sessions: nextSessions,
        };
      });
    },
    renameSession: (sessionId, name) => {
      const trimmedName = name.trim();
      const session = get().sessions[sessionId];
      const nameIsTaken = Object.values(get().sessions).some(
        (candidateSession) =>
          candidateSession.id !== sessionId &&
          normalizeSessionNameForComparison(candidateSession.name) ===
            normalizeSessionNameForComparison(trimmedName),
      );

      if (
        !trimmedName ||
        !session ||
        session.name === trimmedName ||
        nameIsTaken
      ) {
        return;
      }

      set((state) =>
        updateSessionById(state, sessionId, (session) => ({
          ...session,
          name: trimmedName,
        })),
      );
    },
    setSessionDisplayFormatId: (sessionId, displayFormatId) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updateSessionInstruments(session, (instrument) =>
            setInstrumentDisplayFormat(instrument, displayFormatId),
          ),
        ),
      );
    },
    setSessionNoteCollectionKey: (sessionId, noteCollectionKey) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) => {
          let changed = false;
          const parts = session.parts.map((part) => {
            if (part.noteCollectionKey === noteCollectionKey) {
              return part;
            }

            changed = true;
            return clearActiveNotesAffectedByPartTheory({
              ...part,
              noteCollectionKey,
            });
          });

          return changed
            ? {
                ...session,
                parts,
              }
            : undefined;
        }),
      );
    },
    setSessionNoteColorConfig: (sessionId, noteColorConfig) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) => ({
          ...session,
          noteColorConfig,
        })),
      );
    },
    setSessionNoteEmphasis: (sessionId, noteEmphasis) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updateSessionInstruments(session, (instrument) =>
            setInstrumentNoteEmphasis(instrument, noteEmphasis),
          ),
        ),
      );
    },
  };
}
