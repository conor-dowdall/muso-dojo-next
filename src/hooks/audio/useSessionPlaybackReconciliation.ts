"use client";

import { useEffect, useMemo } from "react";
import {
  exercisePlaybackCoordinator,
  rhythmPlaybackCoordinator,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";
import { type AppStore } from "@/stores/app-store/types";
import {
  isExerciseLooperPartModule,
  isRhythmPartModule,
} from "@/utils/session/partModuleTypes";

interface PlaybackModuleIds {
  exercise: readonly string[];
  rhythm: readonly string[];
}

const EMPTY_PLAYBACK_MODULE_IDS: PlaybackModuleIds = {
  exercise: [],
  rhythm: [],
};

function stringArraysAreEqual(
  left: readonly string[],
  right: readonly string[],
) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function createPlaybackModuleIdsSelector(sessionId: string | null) {
  let previousSelection = EMPTY_PLAYBACK_MODULE_IDS;

  return (state: AppStore): PlaybackModuleIds => {
    const session = sessionId ? state.sessions[sessionId] : undefined;

    if (!session) {
      previousSelection = EMPTY_PLAYBACK_MODULE_IDS;
      return previousSelection;
    }

    const nextSelection: PlaybackModuleIds = {
      exercise: session.parts.flatMap((part) =>
        part.modules
          .filter(isExerciseLooperPartModule)
          .map((module) => module.id),
      ),
      rhythm: session.parts.flatMap((part) =>
        part.modules.filter(isRhythmPartModule).map((module) => module.id),
      ),
    };

    if (
      stringArraysAreEqual(
        previousSelection.exercise,
        nextSelection.exercise,
      ) &&
      stringArraysAreEqual(previousSelection.rhythm, nextSelection.rhythm)
    ) {
      return previousSelection;
    }

    previousSelection = nextSelection;
    return previousSelection;
  };
}

export function useSessionPlaybackReconciliation(sessionId: string | null) {
  const selectPlaybackModuleIds = useMemo(
    () => createPlaybackModuleIdsSelector(sessionId),
    [sessionId],
  );
  const playbackModuleIds = useAppStore(selectPlaybackModuleIds);
  const validIds = useMemo(
    () => ({
      exercise: new Set(playbackModuleIds.exercise),
      rhythm: new Set(playbackModuleIds.rhythm),
    }),
    [playbackModuleIds],
  );

  useEffect(() => {
    const exerciseSnapshot = exercisePlaybackCoordinator.getSnapshot();
    exercisePlaybackCoordinator.getActiveIds("manual").forEach((id) => {
      if (!validIds.exercise.has(id)) {
        exercisePlaybackCoordinator.stop(id);
      }
    });
    exerciseSnapshot.pendingIds.forEach((id) => {
      if (
        exerciseSnapshot.pendingOwners?.[id] === "manual" &&
        !validIds.exercise.has(id)
      ) {
        exercisePlaybackCoordinator.cancelPendingStart(id);
      }
    });

    const rhythmSnapshot = rhythmPlaybackCoordinator.getSnapshot();
    rhythmPlaybackCoordinator.getActiveIds("manual").forEach((id) => {
      if (!validIds.rhythm.has(id)) {
        rhythmPlaybackCoordinator.stop(id);
      }
    });
    rhythmSnapshot.pendingIds.forEach((id) => {
      if (
        rhythmSnapshot.pendingOwners?.[id] === "manual" &&
        !validIds.rhythm.has(id)
      ) {
        rhythmPlaybackCoordinator.cancelPendingStart(id);
      }
    });
  }, [validIds]);
}
