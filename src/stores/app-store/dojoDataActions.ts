import { partializeAppStoreSnapshot } from "./persistence";
import { type AppStoreSet, type DojoDataActions } from "./types";
import { createFallbackSessionConfig } from "@/utils/session/createSessionEntities";

export function createDojoDataActions(set: AppStoreSet): DojoDataActions {
  return {
    restoreDojoSnapshot: (snapshot) => {
      set(partializeAppStoreSnapshot(snapshot));
    },
    startFreshDojo: () => {
      const session = createFallbackSessionConfig();

      set({
        activeWorkspace: { kind: "session", id: session.id },
        activeSessionId: session.id,
        arrangements: {},
        sessionWorkspaceViewMode: "session",
        sessions: { [session.id]: session },
      });
    },
  };
}
