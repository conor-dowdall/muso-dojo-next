"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { normalizeRootNoteString } from "@musodojo/music-theory-data";
import { partSequenceCoordinator } from "@/audio";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { type MusicPartConfig } from "@/types/session";
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import { MusicPartView } from "./MusicPartView";
import { type SessionViewMode } from "./sessionViewMode";
import styles from "./SessionView.module.css";

const EMPTY_SESSION_PARTS: MusicPartConfig[] = [];

interface SessionViewProps {
  sessionId: string;
  onOpenAddDialog?: () => void;
  onOpenSessionTempo?: (sessionId: string) => void;
  viewMode?: SessionViewMode;
}

interface SessionPartSummary {
  collectionName: string;
  id: string;
  rootNote: string;
}

export function SessionView({
  sessionId,
  onOpenAddDialog,
  onOpenSessionTempo,
  viewMode = "session",
}: SessionViewProps) {
  const noteColorConfig = useAppStore(
    (state) => state.dojoSettings.noteColorConfig,
  );
  const sessionParts = useAppStore(
    (state) => state.sessions[sessionId]?.parts ?? EMPTY_SESSION_PARTS,
  );
  const parts = useMemo(
    (): SessionPartSummary[] =>
      sessionParts.map((part) => ({
        collectionName: getNoteCollectionDisplayName(part.noteCollectionKey),
        id: part.id,
        rootNote: normalizeRootNoteString(part.rootNote) || part.rootNote,
      })),
    [sessionParts],
  );
  const partSequenceSnapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const partSequenceIsActive =
    partSequenceSnapshot.playing &&
    partSequenceSnapshot.sessionId === sessionId;
  const activePartId = partSequenceIsActive
    ? partSequenceSnapshot.activePartId
    : undefined;
  const pendingPartId = partSequenceIsActive
    ? partSequenceSnapshot.pendingPartId
    : undefined;
  const livePartId = activePartId ?? parts[0]?.id;
  const chromeFreeMode = viewMode === "focus" || viewMode === "live-part";

  const getPartSequenceState = (partId: string) =>
    pendingPartId === partId
      ? "pending"
      : activePartId === partId
        ? "active"
        : undefined;

  return (
    <NoteColorProvider config={noteColorConfig}>
      {parts.length === 0 && onOpenAddDialog ? (
        <div className={styles.emptySession}>
          <Button
            icon={<Plus />}
            label="Add to Session"
            size="md"
            variant="outline"
            onClick={onOpenAddDialog}
          />
        </div>
      ) : viewMode === "band" ? (
        <BandSessionView
          activePartId={activePartId}
          parts={parts}
          pendingPartId={pendingPartId}
        />
      ) : viewMode === "live-part" && livePartId ? (
        <div className={styles.livePartView}>
          {parts.map((part) => {
            const isLivePart = part.id === livePartId;

            return (
              <div
                key={part.id}
                className={styles.livePartHost}
                hidden={!isLivePart}
              >
                <MusicPartView
                  sessionId={sessionId}
                  partId={part.id}
                  partSequenceState={getPartSequenceState(part.id)}
                  isPerformanceMode
                  onOpenSessionTempo={onOpenSessionTempo}
                />
              </div>
            );
          })}
        </div>
      ) : (
        parts.map((part) => (
          <MusicPartView
            key={part.id}
            sessionId={sessionId}
            partId={part.id}
            partSequenceState={getPartSequenceState(part.id)}
            isPerformanceMode={chromeFreeMode}
            onOpenSessionTempo={onOpenSessionTempo}
          />
        ))
      )}
    </NoteColorProvider>
  );
}

function BandSessionView({
  activePartId,
  parts,
  pendingPartId,
}: {
  activePartId?: string;
  parts: SessionPartSummary[];
  pendingPartId?: string;
}) {
  return (
    <section className={styles.bandView} aria-label="Practice Band Parts">
      <ol className={styles.bandGrid}>
        {parts.map((part, index) => {
          const state =
            pendingPartId === part.id
              ? "pending"
              : activePartId === part.id
                ? "active"
                : undefined;

          return (
            <li
              key={part.id}
              aria-current={state === "active" ? "step" : undefined}
              className={styles.bandPart}
              data-part-sequence-state={state}
            >
              <span className={styles.bandPartNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.bandPartRoot}>{part.rootNote}</span>
              <span className={styles.bandPartCollection}>
                {part.collectionName}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
