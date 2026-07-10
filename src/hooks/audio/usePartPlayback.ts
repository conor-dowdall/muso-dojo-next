"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  beatTransportCoordinator,
  createPartSequencePlaybackPlan,
  ensureAudioReady,
  exercisePlaybackCoordinator,
  rhythmPlaybackCoordinator,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";

export function usePartPlayback(sessionId: string, partId: string) {
  const session = useAppStore((state) => state.sessions[sessionId]);
  const exerciseSnapshot = useSyncExternalStore(
    exercisePlaybackCoordinator.subscribe,
    exercisePlaybackCoordinator.getSnapshot,
    exercisePlaybackCoordinator.getSnapshot,
  );
  const rhythmSnapshot = useSyncExternalStore(
    rhythmPlaybackCoordinator.subscribe,
    rhythmPlaybackCoordinator.getSnapshot,
    rhythmPlaybackCoordinator.getSnapshot,
  );
  const step = useMemo(() => {
    if (!session) {
      return undefined;
    }

    return createPartSequencePlaybackPlan(session).parts.find(
      (candidate) => candidate.partId === partId,
    );
  }, [partId, session]);
  const exerciseIds = useMemo(
    () => step?.exerciseRequests.map((request) => request.id) ?? [],
    [step],
  );
  const rhythmIds = useMemo(
    () => step?.rhythmRequests.map((request) => request.id) ?? [],
    [step],
  );
  const previousIds = useRef({ exerciseIds, rhythmIds });
  const exerciseActive = exerciseIds.some(
    (id) => exerciseSnapshot.playbacks[id]?.owner === "manual",
  );
  const rhythmActive = rhythmIds.some(
    (id) => rhythmSnapshot.playbacks[id]?.owner === "manual",
  );
  const isActive = exerciseActive || rhythmActive;

  useEffect(() => {
    const previous = previousIds.current;
    previous.exerciseIds
      .filter((id) => !exerciseIds.includes(id))
      .forEach((id) => {
        if (
          exercisePlaybackCoordinator.getSnapshot().playbacks[id]?.owner ===
          "manual"
        ) {
          exercisePlaybackCoordinator.stop(id);
        }
      });
    previous.rhythmIds
      .filter((id) => !rhythmIds.includes(id))
      .forEach((id) => {
        if (
          rhythmPlaybackCoordinator.getSnapshot().playbacks[id]?.owner ===
          "manual"
        ) {
          rhythmPlaybackCoordinator.stop(id);
        }
      });
    previousIds.current = { exerciseIds, rhythmIds };
  }, [exerciseIds, rhythmIds]);

  const stop = useCallback(() => {
    exerciseIds.forEach((id) => exercisePlaybackCoordinator.stop(id));
    rhythmIds.forEach((id) => rhythmPlaybackCoordinator.stop(id));
  }, [exerciseIds, rhythmIds]);

  const toggle = useCallback(() => {
    if (!step) {
      return;
    }

    if (isActive) {
      stop();
      return;
    }

    void ensureAudioReady();
    void beatTransportCoordinator.startPart({
      exercises: step.exerciseRequests,
      rhythms: step.rhythmRequests,
      source: "manual",
      stopMissing: false,
    });
  }, [isActive, step, stop]);

  return {
    canPlay: step !== undefined,
    isActive,
    toggle,
  };
}
