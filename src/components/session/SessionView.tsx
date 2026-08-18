"use client";

import {
  type CSSProperties,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { Plus } from "lucide-react";
import { partSequenceCoordinator } from "@/audio";
import { NoteColorProvider } from "@/components/note-colors/NoteColorProvider";
import { ChartPlaybackContext } from "@/components/chart/ChartPlaybackContext";
import { Button } from "@/components/ui/buttons/Button";
import { WorkspaceEmptyState } from "@/components/workspace/WorkspaceEmptyState";
import { useAppStore } from "@/stores/appStore";
import { type MusicPartConfig } from "@/types/session";
import { getPartLeadSheetSummary } from "@/utils/music-part/partLeadSheet";
import { PART_DURATION_CHART_BAR_UNITS } from "@/utils/music-part/partDuration";
import { createSessionBarPlan } from "@/utils/music-part/sessionBarPlan";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import { MusicPartView } from "./MusicPartView";
import { SessionPartPlaybackDialog } from "./SessionPartPlaybackDialog";
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
        <WorkspaceEmptyState
          action={
            <Button
              icon={<Plus />}
              label="Add to Session"
              size="sm"
              variant="outline"
              onClick={onOpenAddDialog}
            />
          }
        >
          Add individual Parts or a Chord Progression to start building this
          Session.
        </WorkspaceEmptyState>
      ) : showChart ? (
        <SessionChartView
          activePartId={activePartId}
          playbackActive={partSequenceIsActive}
          sessionId={sessionId}
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
  playbackActive,
  sessionId,
}: {
  activePartId?: string;
  playbackActive: boolean;
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
  const [selectedPartId, setSelectedPartId] = useState(
    () => sessionParts[0]?.id,
  );
  const [playbackDialogPartId, setPlaybackDialogPartId] = useState<
    string | undefined
  >();
  const [playbackDialogOpen, setPlaybackDialogOpen] = useState(false);
  const resolvedSelectedPartId = sessionParts.some(
    ({ id }) => id === selectedPartId,
  )
    ? selectedPartId
    : sessionParts[0]?.id;
  const playbackTargetPartId = activePartId ?? resolvedSelectedPartId;
  const playbackTargetIndex = sessionParts.findIndex(
    ({ id }) => id === playbackTargetPartId,
  );
  const playbackTargetPart = sessionParts[playbackTargetIndex];
  const playbackTargetSummary = playbackTargetPart
    ? getPartLeadSheetSummary(playbackTargetPart, backingBand)
    : undefined;

  return (
    <div className={styles.chartView}>
      {playbackTargetPart && playbackTargetSummary ? (
        <ChartPlaybackContext
          label={`Part ${String(playbackTargetIndex + 1).padStart(2, "0")}`}
          subtitle={playbackTargetSummary.identityLabel}
          onOpenPlayback={() => {
            setPlaybackDialogPartId(playbackTargetPartId);
            setPlaybackDialogOpen(true);
          }}
        />
      ) : null}
      <SessionChart
        activePartId={activePartId}
        ariaLabel="Chart View"
        backingBand={backingBand}
        parts={sessionParts}
        playbackActive={playbackActive}
        selectedPartId={resolvedSelectedPartId}
        onSelectPart={setSelectedPartId}
      />
      {playbackDialogPartId ? (
        <SessionPartPlaybackDialog
          isOpen={playbackDialogOpen}
          partId={playbackDialogPartId}
          sessionId={sessionId}
          onClose={() => setPlaybackDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function SessionChart({
  activePartId,
  ariaLabel,
  backingBand,
  parts,
  playbackActive = false,
  selectedPartId,
  onSelectPart,
}: {
  activePartId?: string;
  ariaLabel: string;
  backingBand: ReturnType<typeof getSessionBackingBandConfig>;
  parts: readonly MusicPartConfig[];
  playbackActive?: boolean;
  selectedPartId?: string;
  onSelectPart?: (partId: string) => void;
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
      playbackActive={playbackActive}
      selectedPartId={selectedPartId}
      onSelectPart={onSelectPart}
    />
  );
}

function BandSessionView({
  activePartId,
  ariaLabel,
  bars,
  playbackActive,
  selectedPartId,
  onSelectPart,
}: {
  activePartId?: string;
  ariaLabel: string;
  bars: SessionChartBar[];
  playbackActive: boolean;
  selectedPartId?: string;
  onSelectPart?: (partId: string) => void;
}) {
  return (
    <section className={styles.bandView} aria-label={ariaLabel}>
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
            <div
              className={styles.bandBarSegments}
              style={
                {
                  "--chart-unused-span": Math.max(
                    0,
                    PART_DURATION_CHART_BAR_UNITS -
                      bar.parts.reduce(
                        (total, part) => total + part.chartSpanUnits,
                        0,
                      ),
                  ),
                } as CSSProperties
              }
            >
              {bar.parts.map((part) => {
                const isActive = activePartId === part.id;
                const isSelected =
                  !playbackActive && selectedPartId === part.id;
                const content = (
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
                );

                return onSelectPart ? (
                  <button
                    key={part.id}
                    aria-current={isActive ? "step" : undefined}
                    aria-disabled={playbackActive ? true : undefined}
                    aria-label={`${part.accessibleLabel}${isSelected ? ". Selected for playback options" : ""}${playbackActive ? ". Chart follows playback" : ""}`}
                    aria-pressed={isSelected}
                    className={styles.bandPart}
                    data-part-sequence-state={isActive ? "active" : undefined}
                    data-selected={isSelected || undefined}
                    style={
                      {
                        "--chart-span": part.chartSpanUnits,
                      } as CSSProperties
                    }
                    tabIndex={playbackActive ? -1 : undefined}
                    type="button"
                    onClick={() => {
                      if (!playbackActive) onSelectPart(part.id);
                    }}
                  >
                    {content}
                  </button>
                ) : (
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
                    {content}
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
