"use client";

import { type CSSProperties, useMemo, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { Button } from "@/components/ui/buttons/Button";
import { useAppStore } from "@/stores/appStore";
import { type MusicPartConfig } from "@/types/session";
import { getPartLeadSheetSummary } from "@/utils/music-part/partLeadSheet";
import { PART_DURATION_CHART_BAR_UNITS } from "@/utils/music-part/partDuration";
import { createSessionBarPlan } from "@/utils/music-part/sessionBarPlan";
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
const EMPTY_CHART_BARS: SessionChartBar[] = [];

interface SessionViewProps {
  sessionId: string;
  onOpenAddDialog?: () => void;
  onOpenSessionTempo?: (sessionId: string) => void;
  viewMode?: SessionViewMode;
}

interface SessionChartPart {
  accessibleLabel: string;
  chartSpanUnits: number;
  id: string;
  identityLabel: string;
}

interface SessionChartBar {
  accessibleLabel: string;
  id: string;
  label: string;
  meterLabel?: string;
  parts: SessionChartPart[];
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
  const chartBars = useMemo((): SessionChartBar[] => {
    if (!showsSessionChart(viewMode)) {
      return EMPTY_CHART_BARS;
    }

    const barPlan = createSessionBarPlan(sessionParts, backingBand);

    return barPlan.entries.map((bar) => {
      return {
        accessibleLabel: `${barPlan.positionLabel} ${bar.accessibleLabel} of ${barPlan.totalAccessibleLabel}${bar.meterLabel ? `. ${bar.meterLabel}` : ""}`,
        id: bar.segments[0]?.part.id ?? bar.label,
        label: bar.label,
        ...(bar.meterLabel ? { meterLabel: bar.meterLabel } : {}),
        parts: bar.segments.map((segment) => {
          const summary = getPartLeadSheetSummary(segment.part, backingBand);
          const segmentDescription = segment.segmentLabel
            ? `Segment ${segment.segmentLabel}. `
            : "";

          return {
            accessibleLabel: `${segmentDescription}${summary.identityAccessibleLabel}. ${summary.meterDetail}`,
            chartSpanUnits: segment.chartSpanUnits,
            id: segment.part.id,
            identityLabel: summary.identityLabel,
          };
        }),
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
          bars={chartBars}
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
  bars,
  pendingPartId,
}: {
  activePartId?: string;
  bars: SessionChartBar[];
  pendingPartId?: string;
}) {
  return (
    <section
      className={styles.bandView}
      aria-label="Chart View"
      style={
        {
          "--chart-bar-units": PART_DURATION_CHART_BAR_UNITS,
        } as CSSProperties
      }
    >
      <ol className={styles.bandGrid}>
        {bars.map((bar) => (
          <li
            key={bar.id}
            aria-label={bar.accessibleLabel}
            className={styles.bandBar}
          >
            <div aria-hidden="true" className={styles.bandBarHeader}>
              <span className={styles.bandBarNumber}>{bar.label}</span>
              {bar.meterLabel ? (
                <span className={styles.bandBarMeter}>{bar.meterLabel}</span>
              ) : null}
            </div>
            <div className={styles.bandBarSegments}>
              {bar.parts.map((part) => {
                const state =
                  activePartId === part.id
                    ? "active"
                    : pendingPartId === part.id
                      ? "pending"
                      : undefined;

                return (
                  <div
                    key={part.id}
                    aria-current={state === "active" ? "step" : undefined}
                    aria-label={part.accessibleLabel}
                    className={styles.bandPart}
                    data-part-sequence-state={state}
                    role="group"
                    style={
                      {
                        "--chart-span": part.chartSpanUnits,
                      } as CSSProperties
                    }
                  >
                    <span className={styles.bandPartIdentity}>
                      {part.identityLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
