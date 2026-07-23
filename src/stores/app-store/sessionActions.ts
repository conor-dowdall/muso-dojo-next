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
import { normalizeSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";

export function createSessionActions(
  set: AppStoreSet,
  get: AppStoreGet,
): SessionActions {
  return {
    setActiveSessionId: (sessionId) => {
      const state = get();

      if (
        (state.activeWorkspace?.kind === "session" &&
          state.activeWorkspace.id === sessionId) ||
        !state.sessions[sessionId]
      ) {
        return;
      }

      set({
        activeWorkspace: { kind: "session", id: sessionId },
        activeSessionId: sessionId,
      });
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
        activeWorkspace: { kind: "session", id: session.id },
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
        activeWorkspace: { kind: "session", id: importedSession.id },
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
        activeWorkspace: { kind: "session", id: clonedSession.id },
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
        const replacementArrangement = Object.values(state.arrangements)[0];
        const wasActive =
          state.activeWorkspace?.kind === "session" &&
          state.activeWorkspace.id === sessionId;
        const activeWorkspace = wasActive
          ? replacementSession
            ? ({ kind: "session", id: replacementSession.id } as const)
            : replacementArrangement
              ? ({
                  kind: "arrangement",
                  id: replacementArrangement.id,
                } as const)
              : null
          : state.activeWorkspace;

        return {
          activeWorkspace,
          activeSessionId:
            activeWorkspace?.kind === "session" ? activeWorkspace.id : null,
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
    setSessionTempoBpm: (sessionId, tempoBpm) => {
      if (!Number.isInteger(tempoBpm) || tempoBpm < 30 || tempoBpm > 300) {
        return;
      }
      const session = get().sessions[sessionId];
      if (!session || (session.tempoBpm ?? 80) === tempoBpm) return;

      set((state) =>
        updateSessionById(state, sessionId, (session) => ({
          ...session,
          tempoBpm,
        })),
      );
    },
    setSessionBackingBand: (sessionId, backingBand) => {
      if (!get().sessions[sessionId]) {
        return;
      }

      const normalized = normalizeSessionBackingBandConfig(backingBand);
      set((state) =>
        updateSessionById(state, sessionId, (session) => ({
          ...session,
          backingBand: normalized,
        })),
      );
    },
  };
}
