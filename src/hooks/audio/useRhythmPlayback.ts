"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useSyncExternalStore } from "react";
import {
  ensureAudioReady,
  isRhythmPlaybackActive,
  rhythmPlaybackCoordinator,
} from "@/audio";
import {
  getRhythmSelectionPattern,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";

export function useRhythmPlayback({
  id,
  rhythm,
  tempoBpm,
}: {
  id: string;
  rhythm: RhythmSelection;
  tempoBpm: number;
}) {
  const snapshot = useSyncExternalStore(
    rhythmPlaybackCoordinator.subscribe,
    rhythmPlaybackCoordinator.getSnapshot,
    rhythmPlaybackCoordinator.getSnapshot,
  );
  const pattern = getRhythmSelectionPattern(rhythm);
  const request = useMemo(
    () => ({
      id,
      pattern,
      tempoBpm,
    }),
    [id, pattern, tempoBpm],
  );
  const submittedRequest = useRef(request);
  const isActive = isRhythmPlaybackActive(snapshot, id);
  const isPlaying = snapshot.playing && snapshot.activeId === id;
  const start = useCallback(() => {
    void ensureAudioReady();
    submittedRequest.current = request;
    void rhythmPlaybackCoordinator.start(request);
  }, [request]);
  const stop = useCallback(() => {
    rhythmPlaybackCoordinator.stop(id);
  }, [id]);

  useLayoutEffect(() => {
    const submitted = submittedRequest.current;

    if (
      !isPlaying ||
      (submitted.id === request.id &&
        submitted.pattern === request.pattern &&
        submitted.tempoBpm === request.tempoBpm)
    ) {
      return;
    }

    submittedRequest.current = request;
    void rhythmPlaybackCoordinator.start(request);
  }, [isPlaying, request]);

  return {
    isActive,
    isPlaying,
    start,
    stop,
  };
}
