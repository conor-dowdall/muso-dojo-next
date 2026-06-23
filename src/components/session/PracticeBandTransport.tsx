"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Drum, Play, Square } from "lucide-react";
import {
  createPartSequencePlaybackPlan,
  ensureAudioReady,
  partSequenceCoordinator,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import { type SessionConfig } from "@/types/session";
import { normalizeRootNoteString } from "@musodojo/music-theory-data";
import { getNoteCollectionDisplayName } from "@/utils/music-theory/getNoteCollectionDisplayName";
import { resolvePracticeBandConfig } from "@/utils/practice-band/practiceBandConfig";
import styles from "./PracticeBandTransport.module.css";

interface PracticeBandTransportProps {
  isPerformanceMode?: boolean;
  sessionId: string;
}

function getPartReadout({
  activeIndex,
  partCount,
  session,
}: {
  activeIndex: number | undefined;
  partCount: number;
  session: SessionConfig;
}) {
  const part =
    activeIndex === undefined ? undefined : session.parts[activeIndex];

  if (activeIndex === undefined || !part) {
    return `${partCount} ${partCount === 1 ? "Part" : "Parts"}`;
  }

  const rootNote = normalizeRootNoteString(part.rootNote) || part.rootNote;
  const collectionName = getNoteCollectionDisplayName(part.noteCollectionKey);
  const partNumber = activeIndex + 1;

  return `Part ${partNumber} / ${partCount} | ${rootNote} ${collectionName}`;
}

export function PracticeBandTransport({
  isPerformanceMode = false,
  sessionId,
}: PracticeBandTransportProps) {
  const session = useAppStore((state) => state.sessions[sessionId]);
  const updatePracticeBandSettings = useAppStore(
    (state) => state.updatePracticeBandSettings,
  );
  const snapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const practiceBand = session?.practiceBand;
  const resolvedPracticeBand = useMemo(
    () => (practiceBand ? resolvePracticeBandConfig(practiceBand) : undefined),
    [practiceBand],
  );
  const plan = useMemo(
    () =>
      session && resolvedPracticeBand
        ? createPartSequencePlaybackPlan(session)
        : undefined,
    [resolvedPracticeBand, session],
  );
  const isActive = snapshot.playing && snapshot.sessionId === sessionId;
  const displayIndex = isActive
    ? (snapshot.pendingIndex ?? snapshot.activeIndex)
    : 0;
  const partCount = session?.parts.length ?? 0;
  const readout = session
    ? getPartReadout({
        activeIndex: displayIndex,
        partCount,
        session,
      })
    : "No Session";
  const shortcuts = useScopedTransportShortcuts({
    isActive,
    onStop: () => partSequenceCoordinator.stop(),
  });

  useEffect(() => {
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

    if (
      currentSnapshot.contentSignature !== plan.contentSignature ||
      currentSnapshot.signature !== plan.signature
    ) {
      void partSequenceCoordinator.restartCurrentPart(plan);
    }
  }, [plan, sessionId]);

  if (!session || partCount === 0 || !plan || !resolvedPracticeBand) {
    return null;
  }

  const handlePress = () => {
    if (isActive) {
      partSequenceCoordinator.stop();
      return;
    }

    void ensureAudioReady();
    void partSequenceCoordinator.start(plan);
  };

  return (
    <div
      className={styles.transport}
      data-performance-mode={isPerformanceMode ? true : undefined}
      onKeyDownCapture={shortcuts.onKeyDownCapture}
      onPointerDownCapture={shortcuts.onPointerDownCapture}
    >
      <IconButton
        aria-label={isActive ? "Stop Practice Band" : "Play Practice Band"}
        aria-keyshortcuts={isActive ? "Space Escape" : undefined}
        icon={isActive ? <Square /> : <Play />}
        selected={isActive}
        shouldYield={false}
        size="sm"
        variant="filled"
        onClick={handlePress}
      />
      <output
        aria-live="polite"
        className={styles.readout}
        data-active={isActive ? true : undefined}
      >
        {readout}
      </output>
      <div
        aria-label="Practice Band options"
        className={styles.optionsControls}
        role="group"
      >
        <Button
          aria-label={
            resolvedPracticeBand.drums
              ? "Mute Practice Band drums"
              : "Unmute Practice Band drums"
          }
          density="compact"
          icon={<Drum />}
          label="Drums"
          selected={resolvedPracticeBand.drums}
          shouldYield={false}
          size="xs"
          variant="outline"
          onClick={() =>
            updatePracticeBandSettings(sessionId, {
              drums: !resolvedPracticeBand.drums,
            })
          }
        />
      </div>
    </div>
  );
}
