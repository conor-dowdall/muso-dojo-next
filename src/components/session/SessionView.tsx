"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { type MusicPartConfig } from "@/types/session";
import { getPartLeadSheetSummary } from "@/utils/music-part/partLeadSheet";
import { MusicPartView } from "./MusicPartView";
import {
  showsOnlyLivePart,
  showsSessionChart,
  type SessionViewMode,
  usesReadOnlyPartChrome,
} from "./sessionViewMode";
import styles from "./SessionView.module.css";

const EMPTY_SESSION_PARTS: MusicPartConfig[] = [];
const EMPTY_PART_IDS: string[] = [];
const EMPTY_PART_SUMMARIES: SessionPartSummary[] = [];

interface SessionViewProps {
  sessionId: string;
  onOpenAddDialog?: () => void;
  onOpenSessionTempo?: (sessionId: string) => void;
  viewMode?: SessionViewMode;
}

interface SessionPartSummary {
  accessibleLabel: string;
  durationLabel?: string;
  id: string;
  identityLabel: string;
  meterLabel: string;
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
  const partIds = useMemo(
    () =>
      sessionParts.length === 0
        ? EMPTY_PART_IDS
        : sessionParts.map((part) => part.id),
    [sessionParts],
  );
  const chartParts = useMemo(
    (): SessionPartSummary[] =>
      showsSessionChart(viewMode)
        ? sessionParts.map((part) => {
            const summary = getPartLeadSheetSummary(part);

            return {
              accessibleLabel: summary.accessibleLabel,
              ...(summary.durationLabel
                ? { durationLabel: summary.durationLabel }
                : {}),
              id: summary.id,
              identityLabel: summary.identityLabel,
              meterLabel: summary.meterLabel,
            };
          })
        : EMPTY_PART_SUMMARIES,
    [sessionParts, viewMode],
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
  const livePartId = activePartId ?? partIds[0];
  const readOnlyPartChrome = usesReadOnlyPartChrome(viewMode);
  const showChart = showsSessionChart(viewMode);
  const showPartsView = !showChart;
  const showOnlyLivePart = showsOnlyLivePart(viewMode);

  const getPartSequenceState = (partId: string) =>
    activePartId === partId
      ? "active"
      : pendingPartId === partId
        ? "pending"
        : undefined;

  return (
    <NoteColorProvider config={noteColorConfig}>
      {partIds.length === 0 && onOpenAddDialog ? (
        <div className={styles.emptySession}>
          <Button
            icon={<Plus />}
            label="Add to Session"
            size="md"
            variant="outline"
            onClick={onOpenAddDialog}
          />
        </div>
      ) : showChart ? (
        <BandSessionView
          activePartId={activePartId}
          parts={chartParts}
          pendingPartId={pendingPartId}
        />
      ) : showPartsView ? (
        <div className={styles.partsView}>
          {partIds.map((partId) => {
            const isHiddenLivePart = showOnlyLivePart && partId !== livePartId;

            return (
              <div
                key={partId}
                className={styles.partHost}
                hidden={isHiddenLivePart}
              >
                <MusicPartView
                  sessionId={sessionId}
                  partId={partId}
                  partSequenceState={getPartSequenceState(partId)}
                  isPerformanceMode={readOnlyPartChrome}
                  onOpenSessionTempo={onOpenSessionTempo}
                  showReadOnlyIdentity={readOnlyPartChrome}
                />
              </div>
            );
          })}
        </div>
      ) : null}
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
    <section className={styles.bandView} aria-label="Chart View">
      <ol className={styles.bandGrid}>
        {parts.map((part, index) => {
          const state =
            activePartId === part.id
              ? "active"
              : pendingPartId === part.id
                ? "pending"
                : undefined;

          return (
            <li
              key={part.id}
              aria-current={state === "active" ? "step" : undefined}
              className={styles.bandPart}
              data-part-sequence-state={state}
              aria-label={`Part ${index + 1}. ${part.accessibleLabel}.`}
            >
              <span className={styles.bandPartNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={styles.bandPartIdentity}
                title={part.identityLabel}
              >
                {part.identityLabel}
              </span>
              <span className={styles.bandPartMeta}>
                {part.durationLabel ? (
                  <span className={styles.bandPartDetail}>
                    {part.durationLabel}
                  </span>
                ) : null}
                <span className={styles.bandPartMeter}>{part.meterLabel}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
