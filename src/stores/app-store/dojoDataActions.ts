import {
  partializeAppStoreSnapshot,
  resolvePersistenceLoadFailure,
} from "./persistence";
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
    clearDojo: () => {
      const session = createFallbackSessionConfig();

      resolvePersistenceLoadFailure();
      set((state) => ({
        activeWorkspace: { kind: "session", id: session.id },
        activeSessionId: session.id,
        arrangements: {},
        dojoSettings: {},
        sessions: { [session.id]: session },
        workspaceMountRevision: state.workspaceMountRevision + 1,
      }));
    },
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
      resolvePersistenceLoadFailure();
      set((state) => ({
        ...partializeAppStoreSnapshot(snapshot),
        workspaceMountRevision: state.workspaceMountRevision + 1,
      }));
    },
  };
}
