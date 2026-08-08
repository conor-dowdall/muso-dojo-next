import { type AppStoreSnapshot } from "@/types/session";
import { normalizeDojoSettings } from "@/utils/session/normalizeDojoSettings";
import { normalizeSessionConfig } from "@/utils/session/normalizeSessionConfig";
import { normalizeArrangementConfig } from "@/utils/arrangement/normalizeArrangementConfig";
import { type ActiveWorkspaceRef } from "@/types/arrangement";
import {
  ensureUniqueIds,
  isRecord,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";
import {
  createUniqueArrangementName,
  createUniqueSessionName,
} from "@/stores/app-store/entityIds";

function ensureUniqueSessionNames<T extends { name: string }>(sessions: T[]) {
  const usedNames: string[] = [];

  return sessions.map((session) => {
    const name = createUniqueSessionName(session.name, usedNames);
    usedNames.push(name);
    return name === session.name ? session : { ...session, name };
  });
}

function ensureUniqueArrangementNames<T extends { name: string }>(
  arrangements: T[],
) {
  const usedNames: string[] = [];

  return arrangements.map((arrangement) => {
    const name = createUniqueArrangementName(arrangement.name, usedNames);
    usedNames.push(name);
    return arrangement.name === name ? arrangement : { ...arrangement, name };
  });
}

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
    activeWorkspace: { kind: "session", id: normalizedActiveSessionId },
    arrangements: {},
    activeSessionId: normalizedActiveSessionId,
    dojoSettings: {},
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
  const uniqueSessions = ensureUniqueSessionNames(
    ensureUniqueIds(normalizedSessions),
  );
  const sessions = sessionRecord
    ? Object.fromEntries(uniqueSessions.map((session) => [session.id, session]))
    : fallbackSnapshot.sessions;
  const arrangementRecord = isRecord(value.arrangements)
    ? value.arrangements
    : undefined;
  const normalizedArrangements = arrangementRecord
    ? Object.entries(arrangementRecord).map(([key, arrangement]) =>
        normalizeArrangementConfig(arrangement, key),
      )
    : [];
  const uniqueArrangements = ensureUniqueArrangementNames(
    ensureUniqueIds(normalizedArrangements),
  );
  const arrangements = arrangementRecord
    ? Object.fromEntries(
        uniqueArrangements.map((arrangement) => [arrangement.id, arrangement]),
      )
    : (fallbackSnapshot.arrangements ?? {});
  const requestedActiveSessionId = normalizeString(value.activeSessionId);
  const firstSessionId = Object.keys(sessions)[0];
  const firstArrangementId = Object.keys(arrangements)[0];
  const requestedWorkspace = isRecord(value.activeWorkspace)
    ? value.activeWorkspace
    : undefined;
  let activeWorkspace: ActiveWorkspaceRef = null;

  if (
    requestedWorkspace?.kind === "session" &&
    typeof requestedWorkspace.id === "string" &&
    sessions[requestedWorkspace.id]
  ) {
    activeWorkspace = { kind: "session", id: requestedWorkspace.id };
  } else if (
    requestedWorkspace?.kind === "arrangement" &&
    typeof requestedWorkspace.id === "string" &&
    arrangements[requestedWorkspace.id]
  ) {
    activeWorkspace = { kind: "arrangement", id: requestedWorkspace.id };
  } else if (requestedActiveSessionId && sessions[requestedActiveSessionId]) {
    activeWorkspace = { kind: "session", id: requestedActiveSessionId };
  } else if (firstSessionId) {
    activeWorkspace = { kind: "session", id: firstSessionId };
  } else if (firstArrangementId) {
    activeWorkspace = { kind: "arrangement", id: firstArrangementId };
  }
  const activeSessionId =
    activeWorkspace?.kind === "session" ? activeWorkspace.id : null;
  return {
    activeWorkspace,
    arrangements,
    activeSessionId,
    dojoSettings: normalizeDojoSettings(value.dojoSettings),
    sessions,
  };
}
