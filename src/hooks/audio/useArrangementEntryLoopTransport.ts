"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  createArrangementEntryLoopPlaybackRequest,
  ensureAudioReady,
  partSequenceCoordinator,
  stopTransportPlayback,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";

export function useArrangementEntryLoopTransport(
  arrangementId: string,
  entryId: string,
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
        ? createArrangementEntryLoopPlaybackRequest(arrangement, entryId)
        : undefined,
    [arrangement, entryId],
  );
  const isActive =
    snapshot.playing &&
    snapshot.owner?.kind === "arrangement" &&
    snapshot.owner.id === arrangementId &&
    snapshot.mode === "arrangement-entry-loop" &&
    (snapshot.activeArrangementContext?.entryId === entryId ||
      snapshot.pendingArrangementContext?.entryId === entryId);
  const canPlay = Boolean(request?.plan.parts.length);

  const togglePlayback = useCallback(() => {
    if (isActive) {
      partSequenceCoordinator.stop();
      return;
    }
    if (!request || !canPlay) return;
    stopTransportPlayback();
    void ensureAudioReady();
    void partSequenceCoordinator.start(request.plan, request.start);
  }, [canPlay, isActive, request]);

  return { canPlay, isActive, togglePlayback };
}
