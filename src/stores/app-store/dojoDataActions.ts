import { partializeAppStoreSnapshot } from "./persistence";
import { type AppStoreSet, type DojoDataActions } from "./types";

export function createDojoDataActions(set: AppStoreSet): DojoDataActions {
  return {
    restoreDojoSnapshot: (snapshot) => {
      set(partializeAppStoreSnapshot(snapshot));
    },
  };
}
