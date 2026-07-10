import {
  resolveAvailableSessionWorkspaceViewMode,
  type SessionWorkspaceViewMode,
} from "@/types/session-view";
import { type AppStoreSet, type WorkspaceActions } from "./types";

export function createWorkspaceActions(set: AppStoreSet): WorkspaceActions {
  return {
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
