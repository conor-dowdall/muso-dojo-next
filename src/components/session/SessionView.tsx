"use client";

import { type CSSProperties, useMemo, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
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
  romanAnalysis?: string;
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
  const partIds = useAppStore(
    useShallow(
      (state) =>
        state.sessions[sessionId]?.parts.map((part) => part.id) ??
        EMPTY_PART_IDS,
    ),
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
  const livePartId = activePartId ?? partIds[0];
  const readOnlyPartChrome = usesReadOnlyPartChrome(viewMode);
  const showChart = showsSessionChart(viewMode);
  const showPartsView = !showChart;
  const showOnlyLivePart = showsOnlyLivePart(viewMode);

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
        <SessionChartView activePartId={activePartId} sessionId={sessionId} />
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
                  isPartSequenceActive={
                    !showOnlyLivePart && activePartId === partId
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

function SessionChartView({
  activePartId,
  sessionId,
}: {
  activePartId?: string;
  sessionId: string;
}) {
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
  return (
    <SessionChart
      activePartId={activePartId}
      ariaLabel="Chart View"
      backingBand={backingBand}
      parts={sessionParts}
    />
  );
}

export function SessionChart({
  activePartId,
  ariaLabel,
  backingBand,
  parts,
}: {
  activePartId?: string;
  ariaLabel: string;
  backingBand: ReturnType<typeof getSessionBackingBandConfig>;
  parts: readonly MusicPartConfig[];
}) {
  const bars = useMemo((): SessionChartBar[] => {
    const barPlan = createSessionBarPlan(parts, backingBand);

    return barPlan.entries.map((bar) => ({
      accessibleLabel: `${barPlan.positionLabel} ${bar.accessibleLabel} of ${barPlan.totalAccessibleLabel}${bar.meterLabel ? `. ${bar.meterLabel}` : ""}`,
      id: bar.segments[0]?.part.id ?? bar.label,
      label: bar.label,
      ...(bar.meterLabel ? { meterLabel: bar.meterLabel } : {}),
      parts: bar.segments.map((segment) => {
        const summary = getPartLeadSheetSummary(segment.part, backingBand);
        const segmentDescription = segment.segmentLabel
          ? `Segment ${segment.segmentLabel}. `
          : "";
        const romanAnalysisDescription = summary.romanAnalysis
          ? `. Roman numeral ${summary.romanAnalysis}`
          : "";

        return {
          accessibleLabel: `${segmentDescription}${summary.identityAccessibleLabel}${romanAnalysisDescription}. ${summary.meterDetail}`,
          chartSpanUnits: segment.chartSpanUnits,
          id: segment.part.id,
          identityLabel: summary.identityLabel,
          ...(summary.romanAnalysis
            ? { romanAnalysis: summary.romanAnalysis }
            : {}),
        };
      }),
    }));
  }, [backingBand, parts]);

  return (
    <BandSessionView
      activePartId={activePartId}
      ariaLabel={ariaLabel}
      bars={bars}
    />
  );
}

function BandSessionView({
  activePartId,
  ariaLabel,
  bars,
}: {
  activePartId?: string;
  ariaLabel: string;
  bars: SessionChartBar[];
}) {
  return (
    <section
      className={styles.bandView}
      aria-label={ariaLabel}
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
                const isActive = activePartId === part.id;

                return (
                  <div
                    key={part.id}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={part.accessibleLabel}
                    className={styles.bandPart}
                    data-part-sequence-state={isActive ? "active" : undefined}
                    role="group"
                    style={
                      {
                        "--chart-span": part.chartSpanUnits,
                      } as CSSProperties
                    }
                  >
                    <span className={styles.bandPartContent}>
                      <span className={styles.bandPartIdentity}>
                        {part.identityLabel}
                      </span>
                      {part.romanAnalysis ? (
                        <span className={styles.bandPartAnalysis}>
                          {part.romanAnalysis}
                        </span>
                      ) : null}
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
