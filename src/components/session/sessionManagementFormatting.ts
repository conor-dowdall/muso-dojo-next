import {
  normalizeRootNoteString,
  noteCollections,
} from "@musodojo/music-theory-data";
import { type MusicPartConfig, type SessionConfig } from "@/types/session";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

export type SessionManagementPartSummary = Pick<
  MusicPartConfig,
  "id" | "rootNote" | "noteCollectionKey"
>;

export interface SessionManagementSessionSummary {
  id: string;
  name: string;
  noteColorConfig?: SessionNoteColorConfig;
  parts: SessionManagementPartSummary[];
}

export interface SessionManagementSnapshot {
  activeSessionId: string | null;
  defaultSessionNoteColorConfig?: SessionNoteColorConfig;
  sessions: SessionManagementSessionSummary[];
}

const maxSessionSignaturePreviewCount = 2;

export function normalizeSessionNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

function getSessionPartCountLabel(partCount: number) {
  return partCount === 1 ? "1 Part" : `${partCount} Parts`;
}

function getSignatureJoiner({
  category,
}: (typeof noteCollections)[keyof typeof noteCollections]) {
  return category === "chord" ? "" : " ";
}

function getPartSignatureLabel(part: SessionManagementPartSummary) {
  const rootNoteLabel = normalizeRootNoteString(part.rootNote) ?? part.rootNote;
  const collection = noteCollections[part.noteCollectionKey];
  const collectionName = collection.primaryName;
  const joiner = getSignatureJoiner(collection);

  return `${rootNoteLabel}${joiner}${collectionName}`;
}

export function getSessionSubtitle(parts: SessionManagementPartSummary[]) {
  if (parts.length === 0) {
    return "No Parts Yet";
  }

  const signatureCounts = new Map<string, number>();

  parts.forEach((part) => {
    const signature = getPartSignatureLabel(part);
    signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
  });

  const signatures = Array.from(signatureCounts.entries()).map(
    ([signature, count]) =>
      count === 1 ? signature : `${signature} x${count}`,
  );
  const previewSignatures = signatures.slice(
    0,
    maxSessionSignaturePreviewCount,
  );
  const remainingSignatureCount = signatures.length - previewSignatures.length;
  const moreSignaturesLabel =
    remainingSignatureCount > 0 ? ` + ${remainingSignatureCount} more` : "";

  return `${getSessionPartCountLabel(
    parts.length,
  )}${DISPLAY_VALUE_SEPARATOR}${previewSignatures.join(
    ", ",
  )}${moreSignaturesLabel}`;
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
    summary.noteColorConfig === session.noteColorConfig &&
    summary.parts.length === session.parts.length &&
    summary.parts.every((partSummary, index) =>
      partSummaryMatchesMusicPart(partSummary, session.parts[index]),
    )
  );
}
