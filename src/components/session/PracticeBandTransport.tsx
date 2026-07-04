"use client";

import {
  type CSSProperties,
  type ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { ListVideo, Square } from "lucide-react";
import {
  createPartSequencePlaybackPlan,
  ensureAudioReady,
  partSequenceCoordinator,
  type PartSequencePlaybackPlan,
  type PartSequenceSnapshot,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import { type SessionConfig } from "@/types/session";
import { createPartBarTimeline } from "@/utils/music-part/partBarTimeline";
import { getPartIdentity } from "@/utils/music-theory/partIdentity";
import {
  resolvePracticeBandConfig,
  type ResolvedPracticeBandConfig,
} from "@/utils/practice-band/practiceBandConfig";
import styles from "./PracticeBandTransport.module.css";

export interface PracticeBandReadoutModel {
  barAccessibleLabel?: string;
  barNumberLabel?: string;
  barTotalAccessibleLabel?: string;
  barTotalLabel?: string;
  countLabel: string;
  identityAccessibleLabel?: string;
  identityLabel?: string;
}

function createPartReadout({
  activeIndex,
  session,
}: {
  activeIndex: number | undefined;
  session: SessionConfig;
}): PracticeBandReadoutModel {
  const part =
    activeIndex === undefined ? undefined : session.parts[activeIndex];
  const barTimeline = createPartBarTimeline(session.parts);
  const barEntry =
    activeIndex === undefined ? undefined : barTimeline.entries[activeIndex];
  const countLabel = barTimeline.totalLabel;

  if (activeIndex === undefined || !part || !barEntry) {
    return {
      countLabel,
    };
  }

  const identity = getPartIdentity(part);

  return {
    countLabel,
    barAccessibleLabel: barEntry.barAccessibleLabel,
    barNumberLabel: barEntry.barNumberLabel,
    barTotalAccessibleLabel: barEntry.barTotalAccessibleLabel,
    barTotalLabel: barEntry.barTotalLabel,
    identityAccessibleLabel: identity.accessibleLabel,
    identityLabel: identity.label,
  };
}

function currentPartNeedsRestart(
  snapshot: PartSequenceSnapshot,
  plan: PartSequencePlaybackPlan,
) {
  if (snapshot.pendingIndex !== undefined) {
    return true;
  }

  const activeIndex = snapshot.activeIndex;

  if (activeIndex === undefined) {
    return true;
  }

  return (
    snapshot.tempoBpm !== plan.tempoBpm ||
    snapshot.partResetSignatures?.[activeIndex] !==
      plan.partResetSignatures[activeIndex]
  );
}

interface PracticeBandTransportState {
  canPlay: boolean;
  isActive: boolean;
  readout: PracticeBandReadoutModel | null;
  resolvedConfig: ResolvedPracticeBandConfig;
  shortcuts: ReturnType<typeof useScopedTransportShortcuts>;
  togglePlayback: () => void;
}

export function usePracticeBandTransport(
  sessionId: string | null,
): PracticeBandTransportState {
  const session = useAppStore((state) =>
    sessionId ? state.sessions[sessionId] : undefined,
  );
  const snapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const resolvedConfig = useMemo(
    () => resolvePracticeBandConfig(session?.practiceBand),
    [session?.practiceBand],
  );
  const plan = useMemo(
    () => (session ? createPartSequencePlaybackPlan(session) : undefined),
    [session],
  );
  const isActive =
    sessionId !== null && snapshot.playing && snapshot.sessionId === sessionId;
  const displayIndex = isActive ? snapshot.activeIndex : undefined;
  const partCount = session?.parts.length ?? 0;
  const canPlay = sessionId !== null && partCount > 0 && plan !== undefined;
  const readout =
    session && isActive
      ? createPartReadout({
          activeIndex: displayIndex,
          session,
        })
      : null;
  const shortcuts = useScopedTransportShortcuts({
    isActive,
    onStop: () => partSequenceCoordinator.stop(),
  });

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const currentSnapshot = partSequenceCoordinator.getSnapshot();

    if (!currentSnapshot.playing || currentSnapshot.sessionId !== sessionId) {
      return;
    }

    if (!plan) {
      partSequenceCoordinator.stop();
      return;
    }

    if (currentSnapshot.sourceSignature !== plan.sourceSignature) {
      partSequenceCoordinator.stop();
      return;
    }

    if (currentSnapshot.updateSignature === plan.updateSignature) {
      return;
    }

    if (currentPartNeedsRestart(currentSnapshot, plan)) {
      void partSequenceCoordinator.restartCurrentPart(plan);
      return;
    }

    partSequenceCoordinator.updatePlan(plan);
  }, [plan, sessionId]);

  const togglePlayback = useCallback(() => {
    if (!canPlay || !plan) {
      return;
    }

    if (isActive) {
      partSequenceCoordinator.stop();
      return;
    }

    void ensureAudioReady();
    void partSequenceCoordinator.start(plan);
  }, [canPlay, isActive, plan]);

  return {
    canPlay,
    isActive,
    readout,
    resolvedConfig,
    shortcuts,
    togglePlayback,
  };
}

interface PracticeBandPlayButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof IconButton>,
  "aria-label" | "icon"
> {
  transport: PracticeBandTransportState;
}

export function PracticeBandPlayButton({
  transport,
  ...props
}: PracticeBandPlayButtonProps) {
  return (
    <IconButton
      {...props}
      aria-label={
        transport.isActive ? "Stop Practice Band" : "Play Practice Band"
      }
      aria-keyshortcuts={
        transport.isActive ? "Space Escape Shift+Space" : "Shift+Space"
      }
      disabled={!transport.canPlay}
      icon={transport.isActive ? <Square /> : <ListVideo />}
      selected={transport.isActive}
      shouldYield={false}
      size="sm"
      onClick={transport.togglePlayback}
    />
  );
}

interface PracticeBandReadoutProps {
  prominence?: "compact" | "title";
  readout: PracticeBandReadoutModel | null;
}

type PracticeBandReadoutStyle = CSSProperties & {
  "--practice-band-compact-position-width": string;
  "--practice-band-part-number-width": string;
  "--practice-band-position-width": string;
};

export function PracticeBandReadout({
  prominence = "compact",
  readout,
}: PracticeBandReadoutProps) {
  if (!readout) {
    return null;
  }

  if (
    readout.barAccessibleLabel === undefined ||
    readout.barNumberLabel === undefined ||
    readout.barTotalLabel === undefined ||
    readout.barTotalAccessibleLabel === undefined ||
    !readout.identityLabel ||
    !readout.identityAccessibleLabel
  ) {
    return (
      <output
        aria-live="polite"
        className={styles.readout}
        data-prominence={prominence}
      >
        {readout.countLabel}
      </output>
    );
  }

  const accessibleLabel = `Bar ${readout.barAccessibleLabel} of ${readout.barTotalAccessibleLabel}. ${readout.identityAccessibleLabel}.`;
  const partNumberWidth = Math.max(
    readout.barNumberLabel.length,
    readout.barTotalLabel.length,
  );
  const readoutStyle: PracticeBandReadoutStyle = {
    "--practice-band-compact-position-width": `${partNumberWidth * 2 + 2.15}ch`,
    "--practice-band-part-number-width": `${partNumberWidth}ch`,
    "--practice-band-position-width": `${partNumberWidth * 2 + 5.7}ch`,
  };

  return (
    <output
      aria-label={accessibleLabel}
      aria-live="polite"
      className={styles.readout}
      data-prominence={prominence}
      style={readoutStyle}
    >
      <span aria-hidden="true" className={styles.partPosition}>
        <span className={styles.partLabel}>Bar</span>
        <span className={styles.partCounter}>
          <span className={styles.partNumber}>{readout.barNumberLabel}</span>
          <span className={styles.partOf}>of</span>
          <span className={styles.partTotal}>{readout.barTotalLabel}</span>
        </span>
      </span>
      <span aria-hidden="true" className={styles.partIdentity}>
        {readout.identityLabel}
      </span>
    </output>
  );
}
