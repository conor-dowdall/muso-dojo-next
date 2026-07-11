"use client";

import { type CSSProperties, useMemo, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { type MusicPartConfig } from "@/types/session";
import { createPartBarTimeline } from "@/utils/music-part/partBarTimeline";
import { getPartLeadSheetSummary } from "@/utils/music-part/partLeadSheet";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
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
  barAccessibleLabel: string;
  barLabel: string;
  barTotalAccessibleLabel: string;
  chartSpanUnits: number;
  id: string;
  identityLabel: string;
  isPartialBar: boolean;
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
  const storedBackingBand = useAppStore(
    (state) => state.sessions[sessionId]?.backingBand,
  );
  const backingBand = useMemo(
    () => getSessionBackingBandConfig(storedBackingBand),
    [storedBackingBand],
  );
  const partIds = useMemo(
    () =>
      sessionParts.length === 0
        ? EMPTY_PART_IDS
        : sessionParts.map((part) => part.id),
    [sessionParts],
  );
  const chartParts = useMemo((): SessionPartSummary[] => {
    if (!showsSessionChart(viewMode)) {
      return EMPTY_PART_SUMMARIES;
    }

    const barTimeline = createPartBarTimeline(sessionParts);

    return sessionParts.map((part, index) => {
      const barEntry = barTimeline.entries[index];

      if (!barEntry) {
        throw new Error("Missing chart bar timeline entry");
      }

      const summary = getPartLeadSheetSummary(part, backingBand);

      return {
        accessibleLabel: summary.accessibleLabel,
        barAccessibleLabel: barEntry.barAccessibleLabel,
        barLabel: barEntry.barLabel,
        barTotalAccessibleLabel: barEntry.barTotalAccessibleLabel,
        chartSpanUnits: summary.chartSpanUnits,
        id: summary.id,
        identityLabel: summary.identityLabel,
        isPartialBar: summary.isPartialBar,
        meterLabel: summary.meterLabel,
      };
    });
  }, [backingBand, sessionParts, viewMode]);
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
                  partSequenceState={
                    showOnlyLivePart ? undefined : getPartSequenceState(partId)
                  }
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
        {parts.map((part) => {
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
              data-chart-duration={part.isPartialBar ? "partial" : "full"}
              data-part-sequence-state={state}
              style={
                {
                  "--chart-span": part.chartSpanUnits,
                } as CSSProperties
              }
              aria-label={`Bar ${part.barAccessibleLabel} of ${part.barTotalAccessibleLabel}. ${part.accessibleLabel}.`}
            >
              <span className={styles.bandPartNumber}>{part.barLabel}</span>
              <span
                className={styles.bandPartIdentity}
                title={part.identityLabel}
              >
                {part.identityLabel}
              </span>
              <span className={styles.bandPartMeta}>
                <span className={styles.bandPartMeter}>{part.meterLabel}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
