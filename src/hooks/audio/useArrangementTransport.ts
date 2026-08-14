"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  createArrangementEntryLoopPlaybackRequest,
  createArrangementPlaybackRequest,
  ensureAudioReady,
  getPartSequencePlanReconciliation,
  partSequenceCoordinator,
  stopTransportPlayback,
} from "@/audio";
import { useScopedTransportShortcuts } from "@/hooks/interaction/useScopedTransportShortcuts";
import { useAppStore } from "@/stores/appStore";

export function useArrangementTransport(arrangementId: string) {
  const arrangement = useAppStore((state) => state.arrangements[arrangementId]);
  const snapshot = useSyncExternalStore(
    partSequenceCoordinator.subscribe,
    partSequenceCoordinator.getSnapshot,
    partSequenceCoordinator.getSnapshot,
  );
  const fullRequest = useMemo(
    () =>
      arrangement ? createArrangementPlaybackRequest(arrangement) : undefined,
    [arrangement],
  );
  const entryLoopId =
    snapshot.playing &&
    snapshot.owner?.kind === "arrangement" &&
    snapshot.owner.id === arrangementId &&
    snapshot.mode === "arrangement-entry-loop"
      ? (snapshot.activeArrangementContext?.entryId ??
        snapshot.pendingArrangementContext?.entryId)
      : undefined;
  const request = useMemo(
    () =>
      arrangement && entryLoopId
        ? createArrangementEntryLoopPlaybackRequest(arrangement, entryLoopId)
        : fullRequest,
    [arrangement, entryLoopId, fullRequest],
  );
  const isActive =
    snapshot.playing &&
    snapshot.owner?.kind === "arrangement" &&
    snapshot.owner.id === arrangementId;
  const canPlay = Boolean(fullRequest);
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
    const plan = request?.plan;
    const reconciliation = getPartSequencePlanReconciliation(current, plan);

    if (reconciliation === "stop") {
      partSequenceCoordinator.stop();
    } else if (reconciliation === "retime" && plan) {
      void partSequenceCoordinator.retimeCurrentPart(plan);
    } else if (reconciliation === "restart" && plan) {
      void partSequenceCoordinator.restartCurrentPart(plan);
    } else if (reconciliation === "update" && plan) {
      partSequenceCoordinator.updatePlan(plan);
    }
  }, [arrangementId, request, snapshot]);

  const togglePlayback = useCallback(() => {
    if (isActive) {
      partSequenceCoordinator.stop();
      return;
    }
    if (!fullRequest) return;
    stopTransportPlayback();
    void ensureAudioReady();
    void partSequenceCoordinator.start(fullRequest.plan, fullRequest.start);
  }, [fullRequest, isActive]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const editable =
        target instanceof Element &&
        target.closest(
          "input, select, textarea, [contenteditable], [role='combobox'], [role='listbox'], [role='searchbox'], [role='slider'], [role='spinbutton'], [role='textbox']",
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
    shortcuts,
    snapshot,
    togglePlayback,
  };
}
