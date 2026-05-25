import { type AppStoreSnapshot } from "@/types/session";
import { normalizeAppStoreSnapshot } from "@/utils/session/normalizeAppStoreSnapshot";

export const APP_STORE_VERSION = 1;

export type AppStorePersistedSnapshot = AppStoreSnapshot;

export function partializeAppStoreSnapshot(
  state: AppStoreSnapshot,
): AppStorePersistedSnapshot {
  return {
    activeSessionId: state.activeSessionId,
    sessions: state.sessions,
  };
}

export function migrateAppStoreSnapshot(
  persistedState: unknown,
  _persistedVersion: number,
  fallbackSnapshot: AppStoreSnapshot,
): AppStorePersistedSnapshot {
  // Preserve recoverable user sessions across version changes; reset only when
  // the persisted value cannot be normalized into a valid store snapshot.
  return normalizeAppStoreSnapshot(persistedState, fallbackSnapshot);
}
