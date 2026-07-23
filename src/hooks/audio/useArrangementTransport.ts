"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  createArrangementPlaybackRequest,
  ensureAudioReady,
  partSequenceCoordinator,
  stopTransportPlayback,
} from "@/audio";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import { useAppStore } from "@/stores/appStore";

export function useArrangementTransport(
  arrangementId: string,
  selectedEntryId: string | undefined,
) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const snapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const request = useMemo(
    () =>
      arrangement
        ? createArrangementPlaybackRequest(arrangement, selectedEntryId)
        : undefined,
    [arrangement, selectedEntryId],
  );
  const isActive =
    snapshot.playing &&
    snapshot.owner?.kind === "arrangement" &&
    snapshot.owner.id === arrangementId;
  const canPlay = Boolean(request);
  const shortcuts = useScopedTransportShortcuts({
    isActive,
    onStop: () => partSequenceCoordinator.stop(),
  });

  useEffect(() => {
    const current = partSequenceCoordinator.getSnapshot();
    if (
      !current.playing ||
      current.owner?.kind !== "arrangement" ||
      current.owner.id !== arrangementId
    ) {
      return;
    }
    if (!request || current.sourceSignature !== request.plan.sourceSignature) {
      partSequenceCoordinator.stop();
      return;
    }
    if (current.updateSignature === request.plan.updateSignature) return;
    const index = current.activeIndex;
    if (
      index === undefined ||
      current.pendingIndex !== undefined ||
      current.partResetSignatures?.[index] !==
        request.plan.partResetSignatures[index]
    ) {
      void partSequenceCoordinator.restartCurrentPart(request.plan);
      return;
    }
    partSequenceCoordinator.updatePlan(request.plan);
  }, [arrangementId, request]);

  const togglePlayback = useCallback(() => {
    if (isActive) {
      partSequenceCoordinator.stop();
      return;
    }
    if (!request) return;
    stopTransportPlayback();
    void ensureAudioReady();
    void partSequenceCoordinator.start(request.plan, request.start);
  }, [isActive, request]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const editable =
        target instanceof Element &&
        target.closest(
          "input, select, textarea, [contenteditable], [role='slider'], [role='spinbutton'], [role='textbox']",
        );
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !event.shiftKey ||
        (event.key !== " " && event.code !== "Space") ||
        editable ||
        document.querySelector("dialog[open]")
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      togglePlayback();
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [togglePlayback]);

  const context = snapshot.activeArrangementContext;
  return {
    activeEntryId: isActive ? context?.entryId : undefined,
    activePlayCount: isActive ? context?.playCount : undefined,
    activePlayIndex: isActive ? context?.playIndex : undefined,
    canPlay,
    isActive,
    pendingEntryId: isActive
      ? snapshot.pendingArrangementContext?.entryId
      : undefined,
    plan: request?.plan,
    readout:
      isActive && context
        ? `Play ${context.playIndex + 1} of ${context.playCount}`
        : null,
    shortcuts,
    snapshot,
    togglePlayback,
  };
}
