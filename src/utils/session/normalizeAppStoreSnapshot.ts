import { type AppStoreSnapshot } from "@/types/session";
import { normalizeSessionConfig } from "@/utils/session/normalizeSessionConfig";
import {
  ensureUniqueIds,
  isRecord,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";

export function createAppStoreSnapshot(
  session: unknown,
  activeSessionId?: string,
): AppStoreSnapshot {
  const normalizedSession = normalizeSessionConfig(session);
  const requestedActiveSessionId = normalizeString(activeSessionId);
  const normalizedActiveSessionId =
    requestedActiveSessionId === normalizedSession.id
      ? requestedActiveSessionId
      : normalizedSession.id;

  return {
    activeSessionId: normalizedActiveSessionId,
    sessions: {
      [normalizedSession.id]: normalizedSession,
    },
  };
}

export function normalizeAppStoreSnapshot(
  value: unknown,
  fallbackSnapshot = createAppStoreSnapshot({}),
): AppStoreSnapshot {
  if (!isRecord(value)) {
    return fallbackSnapshot;
  }

  const sessionRecord = isRecord(value.sessions) ? value.sessions : undefined;
  const normalizedSessions = sessionRecord
    ? Object.values(sessionRecord).map((session) =>
        normalizeSessionConfig(session),
      )
    : [];
  const uniqueSessions = ensureUniqueIds(normalizedSessions);
  const sessions = sessionRecord
    ? Object.fromEntries(uniqueSessions.map((session) => [session.id, session]))
    : fallbackSnapshot.sessions;
  const requestedActiveSessionId = normalizeString(value.activeSessionId);
  const firstSessionId = Object.keys(sessions)[0];
  const activeSessionId =
    requestedActiveSessionId && sessions[requestedActiveSessionId]
      ? requestedActiveSessionId
      : (firstSessionId ?? null);

  return {
    activeSessionId,
    sessions,
  };
}
