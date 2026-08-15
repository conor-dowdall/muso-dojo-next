"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  createArrangementPlaybackRequestFromEntry,
  ensureAudioReady,
  partSequenceCoordinator,
  stopTransportPlayback,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";

export function useArrangementPlayFromEntryTransport(
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
        ? createArrangementPlaybackRequestFromEntry(arrangement, entryId)
        : undefined,
    [arrangement, entryId],
  );
  const isActive =
    snapshot.playing &&
    snapshot.owner?.kind === "arrangement" &&
    snapshot.owner.id === arrangementId &&
    snapshot.mode === "arrangement-from-entry";
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
