"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import {
  createAppStoreSnapshot,
  normalizeAppStoreSnapshot,
} from "@/utils/session/normalizeAppStoreSnapshot";
import { createFallbackSessionConfig } from "@/utils/session/createSessionEntities";
import {
  APP_STORE_VERSION,
  type AppStorePersistedSnapshot,
  migrateAppStoreSnapshot,
  partializeAppStoreSnapshot,
} from "@/stores/app-store/persistence";
import { createAppStoreActions } from "@/stores/app-store/actions";
import { type AppStore } from "@/stores/app-store/types";

export type {
  AppStore,
  InstrumentSettingsPatch,
} from "@/stores/app-store/types";

const initialSnapshot = createAppStoreSnapshot(createFallbackSessionConfig());
let hasRequestedHydration = false;
let hasCompletedHydration = false;

export const useAppStore = create<AppStore>()(
  devtools(
    persist<AppStore, [], [], AppStorePersistedSnapshot>(
      (set, get) => ({
        ...initialSnapshot,
        ...createAppStoreActions(set, get),
      }),
      {
        name: "muso-dojo-app-store",
        version: APP_STORE_VERSION,
        storage: createJSONStorage<AppStorePersistedSnapshot>(
          () => localStorage,
        ),
        partialize: partializeAppStoreSnapshot,
        migrate: (persistedState, persistedVersion) =>
          migrateAppStoreSnapshot(
            persistedState,
            persistedVersion,
            initialSnapshot,
          ),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...normalizeAppStoreSnapshot(persistedState, initialSnapshot),
        }),
        skipHydration: true,
      },
    ),
    {
      name: "Muso Dojo",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

export function useHydrateAppStore() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const markHydrated = () => {
      hasCompletedHydration = true;

      if (isSubscribed) {
        setHasHydrated(true);
      }
    };
    const unsubscribeFromHydrationFinish =
      useAppStore.persist.onFinishHydration(markHydrated);

    if (hasCompletedHydration || useAppStore.persist.hasHydrated()) {
      markHydrated();

      return () => {
        isSubscribed = false;
        unsubscribeFromHydrationFinish();
      };
    }

    if (!hasRequestedHydration) {
      hasRequestedHydration = true;

      try {
        void Promise.resolve(useAppStore.persist.rehydrate()).catch(
          markHydrated,
        );
      } catch {
        markHydrated();
      }
    }

    return () => {
      isSubscribed = false;
      unsubscribeFromHydrationFinish();
    };
  }, []);

  return hasHydrated;
}
