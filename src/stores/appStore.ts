"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  createAppStoreSnapshot,
  normalizeAppStoreSnapshot,
} from "@/utils/session/normalizeAppStoreSnapshot";
import { createFallbackSessionConfig } from "@/utils/session/createSessionEntities";
import {
  APP_STORE_VERSION,
  APP_STORE_STORAGE_KEY,
  type AppStorePersistedSnapshot,
  createDebouncedAppStoreStorage,
  normalizePersistedAppStoreSnapshot,
  partializeAppStoreSnapshot,
} from "@/stores/app-store/persistence";
import { createAppStoreInitializer } from "@/stores/app-store/storeInitializer";
import { type AppStore } from "@/stores/app-store/types";

export type {
  DroneSettingsPatch,
  AppStore,
  FretboardInstrumentSettingsPatch,
  KeyboardInstrumentSettingsPatch,
} from "@/stores/app-store/types";

const initialSnapshot = createAppStoreSnapshot(createFallbackSessionConfig());
let hasRequestedHydration = false;
let hasCompletedHydration = false;

export const useAppStore = create<AppStore>()(
  devtools(
    persist<AppStore, [], [], AppStorePersistedSnapshot>(
      createAppStoreInitializer(initialSnapshot),
      {
        name: APP_STORE_STORAGE_KEY,
        version: APP_STORE_VERSION,
        storage:
          typeof window === "undefined"
            ? undefined
            : createDebouncedAppStoreStorage(() => window.localStorage),
        partialize: partializeAppStoreSnapshot,
        migrate: (persistedState) =>
          normalizePersistedAppStoreSnapshot(persistedState, initialSnapshot),
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
        void Promise.resolve(useAppStore.persist.rehydrate()).then(
          markHydrated,
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
