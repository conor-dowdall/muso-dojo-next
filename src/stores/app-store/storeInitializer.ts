import { createStore, type StateCreator } from "zustand/vanilla";
import { type AppStoreSnapshot } from "@/types/session";
import { createAppStoreActions } from "./actions";
import { type AppStore } from "./types";

export function createAppStoreInitializer(
  initialSnapshot: AppStoreSnapshot,
): StateCreator<AppStore> {
  return (set, get) => ({
    ...initialSnapshot,
    ...createAppStoreActions(set, get),
  });
}

export function createAppStore(initialSnapshot: AppStoreSnapshot) {
  return createStore<AppStore>()(createAppStoreInitializer(initialSnapshot));
}
