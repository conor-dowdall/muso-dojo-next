import { rootAndNoteCollection } from "@musodojo/music-theory-data";
import { type MusicPartConfig, type SessionConfig } from "@/types/session";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

export type SessionManagementPartSummary = Pick<
  MusicPartConfig,
  "id" | "rootNote" | "noteCollectionKey"
>;

export interface SessionManagementSessionSummary {
  id: string;
  name: string;
  parts: SessionManagementPartSummary[];
  tempoBpm: number;
}

export interface SessionManagementSnapshot {
  activeSessionId: string | null;
  sessions: SessionManagementSessionSummary[];
}

export function normalizeSessionNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

function getSessionPartCountLabel(partCount: number) {
  return partCount === 1 ? "1 Part" : `${partCount} Parts`;
}

function getPartSignatureLabel(part: SessionManagementPartSummary) {
  return rootAndNoteCollection.getIdentity(part).label;
}

export function getSessionSubtitle(
  parts: SessionManagementPartSummary[],
  tempoBpm: number,
) {
  if (parts.length === 0) {
    return "No Parts Yet";
  }

  const firstPartLabel = getPartSignatureLabel(parts[0]!);
  const partPreview =
    parts.length === 1 ? firstPartLabel : `${firstPartLabel}...`;

  return [
    getSessionPartCountLabel(parts.length),
    partPreview,
    `${tempoBpm} BPM`,
  ].join(DISPLAY_VALUE_SEPARATOR);
}

export function createSessionPartSummary(
  part: MusicPartConfig,
): SessionManagementPartSummary {
  return {
    id: part.id,
    rootNote: part.rootNote,
    noteCollectionKey: part.noteCollectionKey,
  };
}

function partSummaryMatchesMusicPart(
  summary: SessionManagementPartSummary,
  part: MusicPartConfig,
) {
  return (
    summary.id === part.id &&
    summary.rootNote === part.rootNote &&
    summary.noteCollectionKey === part.noteCollectionKey
  );
}

export function sessionSummaryMatchesSession(
  summary: SessionManagementSessionSummary,
  session: SessionConfig,
) {
  return (
    summary.id === session.id &&
    summary.name === session.name &&
    summary.tempoBpm === (session.tempoBpm ?? 80) &&
    summary.parts.length === session.parts.length &&
    summary.parts.every((partSummary, index) => {
      const part = session.parts[index];
      return part ? partSummaryMatchesMusicPart(partSummary, part) : false;
    })
  );
}
