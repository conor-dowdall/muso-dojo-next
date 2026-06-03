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
      const session = createDefaultSessionConfig({
        ...settings,
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
  };
}
