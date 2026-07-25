import { type ArrangementConfig } from "@/types/arrangement";
import { type SessionConfig } from "@/types/session";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

type ArrangementLibrarySummary = Pick<
  ArrangementConfig,
  "entries" | "sections" | "tempoBpm"
>;

type ArrangementSourceSessionSummary = Pick<
  SessionConfig,
  "lastModified" | "parts"
>;

function getSourceSessionStatusCounts(
  arrangement: ArrangementLibrarySummary,
  sessions: Readonly<Record<string, ArrangementSourceSessionSummary>>,
) {
  const changedSessionIds = new Set<string>();
  const unavailableSessionIds = new Set<string>();

  arrangement.sections.forEach((section) => {
    const session = sessions[section.source.sessionId];
    if (!session) {
      unavailableSessionIds.add(section.source.sessionId);
      return;
    }

    if (
      session.parts.length > 0 &&
      session.lastModified !== section.source.sessionLastModified
    ) {
      changedSessionIds.add(section.source.sessionId);
    }
  });

  return {
    changedSessionCount: changedSessionIds.size,
    unavailableSessionCount: unavailableSessionIds.size,
  };
}

export function countArrangementsUsingSession(
  arrangements: readonly ArrangementConfig[],
  sessionId: string,
) {
  return arrangements.filter((arrangement) =>
    arrangement.sections.some(
      (section) => section.source.sessionId === sessionId,
    ),
  ).length;
}

export function getArrangementLibrarySubtitle(
  arrangement: ArrangementLibrarySummary,
  sessions: Readonly<Record<string, ArrangementSourceSessionSummary>>,
) {
  const sectionCount = arrangement.entries.length;
  if (sectionCount === 0) {
    return "No Sections Yet";
  }

  const { changedSessionCount, unavailableSessionCount } =
    getSourceSessionStatusCounts(arrangement, sessions);
  const sourceStatus =
    unavailableSessionCount > 0
      ? `${unavailableSessionCount} ${
          unavailableSessionCount === 1 ? "Session" : "Sessions"
        } Unavailable`
      : changedSessionCount > 0
        ? `${changedSessionCount} ${
            changedSessionCount === 1 ? "Session" : "Sessions"
          } Changed`
        : undefined;

  return [
    `${sectionCount} ${sectionCount === 1 ? "Section" : "Sections"}`,
    `${arrangement.tempoBpm} BPM`,
    sourceStatus,
  ]
    .filter((value) => value !== undefined)
    .join(DISPLAY_VALUE_SEPARATOR);
}
