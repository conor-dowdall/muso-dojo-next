import { partializeAppStoreSnapshot } from "./persistence";
import { type AppStoreSet, type DojoDataActions } from "./types";
import {
  createEntityId,
  createFallbackSessionConfig,
} from "@/utils/session/createSessionEntities";
import {
  mergeDojoBackupResources,
  type DojoResourceImportResult,
} from "@/utils/dojo-backup/dojoResourceImport";

export function createDojoDataActions(set: AppStoreSet): DojoDataActions {
  return {
    importDojoBackupResources: (snapshot, selectedKeys) => {
      let result: DojoResourceImportResult | undefined;

      set((state) => {
        result = mergeDojoBackupResources(
          state.dojoSettings,
          snapshot.dojoSettings,
          new Set(selectedKeys),
          (kind) => createEntityId(kind),
        );

        return result.imported > 0
          ? { dojoSettings: result.dojoSettings }
          : state;
      });

      if (!result) {
        throw new Error("The resource import could not be completed.");
      }

      return result;
    },
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
