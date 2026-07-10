"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useSyncExternalStore } from "react";
import {
  beatTransportCoordinator,
  ensureAudioReady,
  getRhythmPlaybackOwner,
  isRhythmPlaybackActive,
  rhythmPlaybackCoordinator,
} from "@/audio";
import {
  getRhythmSelectionRecipe,
  getRhythmSelectionPattern,
  type RhythmRecipe,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";

function rhythmResetFieldsAreEqual(left: RhythmRecipe, right: RhythmRecipe) {
  return (
    left.beats === right.beats &&
    left.grouping === right.grouping &&
    left.groove === right.groove
  );
}

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
  const recipe = useMemo(() => getRhythmSelectionRecipe(rhythm), [rhythm]);
  const pattern = useMemo(() => getRhythmSelectionPattern(rhythm), [rhythm]);
  const request = useMemo(
    () => ({
      id,
      pattern,
      tempoBpm,
    }),
    [id, pattern, tempoBpm],
  );
  const submittedRequest = useRef(request);
  const submittedRecipe = useRef(recipe);
  const isActive = isRhythmPlaybackActive(snapshot, id);
  const isPlaying = snapshot.playbacks[id] !== undefined;
  const playbackOwner = getRhythmPlaybackOwner(snapshot, id);
  const isBandOwned = playbackOwner === "part-sequence";
  const start = useCallback(() => {
    void ensureAudioReady();
    submittedRequest.current = request;
    submittedRecipe.current = recipe;
    void beatTransportCoordinator.startRhythm(request);
  }, [recipe, request]);
  const stop = useCallback(() => {
    beatTransportCoordinator.stopRhythm(id);
  }, [id]);

  useLayoutEffect(() => {
    const submitted = submittedRequest.current;

    if (!isActive) {
      submittedRequest.current = request;
      submittedRecipe.current = recipe;
      return;
    }

    if (!isPlaying) {
      return;
    }

    if (
      submitted.id !== request.id ||
      submitted.tempoBpm !== request.tempoBpm ||
      !rhythmResetFieldsAreEqual(submittedRecipe.current, recipe)
    ) {
      submittedRequest.current = request;
      submittedRecipe.current = recipe;
      if (!isBandOwned) {
        void beatTransportCoordinator.startRhythm(request);
      }
      return;
    }

    if (submitted.pattern !== request.pattern) {
      rhythmPlaybackCoordinator.setPattern(id, request.pattern);
    }

    submittedRequest.current = request;
    submittedRecipe.current = recipe;
  }, [id, isActive, isBandOwned, isPlaying, recipe, request]);

  return {
    isActive,
    isPlaying,
    start,
    stop,
  };
}
