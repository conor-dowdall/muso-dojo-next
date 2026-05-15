import { createCopyId, createUniqueSessionName } from "./entityIds";
import { normalizeSessionForWrite } from "./writeNormalization";
import { type SessionConfig } from "@/types/session";

export function createImportedSessionConfig(
  session: SessionConfig,
  existingSessions: Record<string, SessionConfig>,
): SessionConfig {
  const importedSession = normalizeSessionForWrite(session);
  const existingSessionIds = Object.keys(existingSessions);
  const existingSessionNames = Object.values(existingSessions).map(
    (session) => session.name,
  );

  return {
    ...importedSession,
    id: existingSessions[importedSession.id]
      ? createCopyId(importedSession.id, existingSessionIds)
      : importedSession.id,
    name: createUniqueSessionName(importedSession.name, existingSessionNames),
  };
}
