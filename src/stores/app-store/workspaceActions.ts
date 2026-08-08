import { type ArrangementWorkspaceViewMode } from "@/types/arrangement";
import { type SessionWorkspaceViewMode } from "@/types/session-view";
import { type AppStoreSet, type WorkspaceActions } from "./types";

export function createWorkspaceActions(set: AppStoreSet): WorkspaceActions {
  return {
    setArrangementWorkspaceViewMode: (
      arrangementId: string,
      mode: ArrangementWorkspaceViewMode,
    ) => {
      set((state) => {
        const arrangement = state.arrangements[arrangementId];

        if (!arrangement || arrangement.workspaceViewMode === mode) {
          return state;
        }

        return {
          arrangements: {
            ...state.arrangements,
            [arrangementId]: { ...arrangement, workspaceViewMode: mode },
          },
        };
      });
    },
    setActiveWorkspace: (workspace) => {
      set((state) => {
        const valid =
          workspace === null ||
          (workspace.kind === "session"
            ? Boolean(state.sessions[workspace.id])
            : Boolean(state.arrangements[workspace.id]));
        if (!valid) {
          return state;
        }
        const activeSessionId =
          workspace?.kind === "session" ? workspace.id : null;
        return state.activeWorkspace?.kind === workspace?.kind &&
          state.activeWorkspace?.id === workspace?.id &&
          state.activeSessionId === activeSessionId
          ? state
          : { activeWorkspace: workspace, activeSessionId };
      });
    },
    setSessionWorkspaceViewMode: (
      sessionId: string,
      mode: SessionWorkspaceViewMode,
    ) => {
      set((state) => {
        const session = state.sessions[sessionId];

        if (!session || session.workspaceViewMode === mode) {
          return state;
        }

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: { ...session, workspaceViewMode: mode },
          },
        };
      });

      return mode;
    },
  };
}
