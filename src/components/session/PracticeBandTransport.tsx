"use client";

import { rootAndNoteCollection } from "@musodojo/music-theory-data";
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
  stopAllAudioPlayback,
  type PartSequencePlaybackPlan,
  type PartSequenceSnapshot,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import { type SessionConfig } from "@/types/session";
import { createPartBarTimeline } from "@/utils/music-part/partBarTimeline";
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
  activePartId,
  session,
}: {
  activePartId: string | undefined;
  session: SessionConfig;
}): PracticeBandReadoutModel {
  const activeIndex = session.parts.findIndex(
    (part) => part.id === activePartId,
  );
  const part = activeIndex < 0 ? undefined : session.parts[activeIndex];
  const barTimeline = createPartBarTimeline(session.parts);
  const barEntry =
    activeIndex < 0 ? undefined : barTimeline.entries[activeIndex];
  const countLabel = barTimeline.totalLabel;

  if (!part || !barEntry) {
    return {
      countLabel,
    };
  }

  const identity = rootAndNoteCollection.getIdentity(part);

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

export interface PracticeBandTransportState {
  canPlay: boolean;
  isActive: boolean;
  readout: PracticeBandReadoutModel | null;
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
  const plan = useMemo(() => {
    if (!session) {
      return undefined;
    }

    return snapshot.playing &&
      snapshot.sessionId === sessionId &&
      snapshot.mode === "part-loop"
      ? createPartSequencePlaybackPlan(session, {
          mode: "part-loop",
          partId: snapshot.activePartId ?? snapshot.pendingPartId,
        })
      : createPartSequencePlaybackPlan(session);
  }, [
    session,
    sessionId,
    snapshot.activePartId,
    snapshot.mode,
    snapshot.pendingPartId,
    snapshot.playing,
    snapshot.sessionId,
  ]);
  const isActive =
    sessionId !== null && snapshot.playing && snapshot.sessionId === sessionId;
  const partCount = session?.parts.length ?? 0;
  const canPlay = sessionId !== null && partCount > 0 && plan !== undefined;
  const readout =
    session && isActive
      ? createPartReadout({
          activePartId: snapshot.activePartId,
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

    stopAllAudioPlayback();
    void ensureAudioReady();
    void partSequenceCoordinator.start(plan);
  }, [canPlay, isActive, plan]);

  return {
    canPlay,
    isActive,
    readout,
    shortcuts,
    togglePlayback,
  };
}

export function usePartBandLoopTransport(
  sessionId: string | undefined,
  partId: string,
) {
  const session = useAppStore((state) =>
    sessionId ? state.sessions[sessionId] : undefined,
  );
  const snapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const plan = useMemo(
    () =>
      session
        ? createPartSequencePlaybackPlan(session, {
            mode: "part-loop",
            partId,
          })
        : undefined,
    [partId, session],
  );
  const isActive =
    Boolean(sessionId) &&
    snapshot.playing &&
    snapshot.sessionId === sessionId &&
    snapshot.mode === "part-loop" &&
    (snapshot.activePartId === partId || snapshot.pendingPartId === partId);
  const canPlay = Boolean(plan?.parts.length);

  const togglePlayback = useCallback(() => {
    if (isActive) {
      partSequenceCoordinator.stop();
      return;
    }

    if (!plan || !canPlay) {
      return;
    }

    stopAllAudioPlayback();
    void ensureAudioReady();
    void partSequenceCoordinator.start(plan);
  }, [canPlay, isActive, plan]);

  return { canPlay, isActive, togglePlayback };
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
        transport.isActive ? "Stop Backing Band" : "Play Backing Band"
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
