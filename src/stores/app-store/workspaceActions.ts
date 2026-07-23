import {
  resolveAvailableSessionWorkspaceViewMode,
  type SessionWorkspaceViewMode,
} from "@/types/session-view";
import { type AppStoreSet, type WorkspaceActions } from "./types";

export function createWorkspaceActions(set: AppStoreSet): WorkspaceActions {
  return {
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
    setSessionWorkspaceViewMode: (mode: SessionWorkspaceViewMode) => {
      let resolvedMode: SessionWorkspaceViewMode = "session";

      set((state) => {
        const activePartCount = state.activeSessionId
          ? (state.sessions[state.activeSessionId]?.parts.length ?? 0)
          : 0;
        resolvedMode = resolveAvailableSessionWorkspaceViewMode(
          mode,
          activePartCount,
        );

        return resolvedMode === state.sessionWorkspaceViewMode
          ? state
          : { sessionWorkspaceViewMode: resolvedMode };
      });

      return resolvedMode;
    },
  };
}
