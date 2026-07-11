"use client";

import { useEffect, useMemo } from "react";
import {
  exercisePlaybackCoordinator,
  rhythmPlaybackCoordinator,
} from "@/audio";
import { type SessionConfig } from "@/types/session";
import {
  isExerciseLooperPartModule,
  isRhythmPartModule,
} from "@/utils/session/partModuleTypes";

export function useSessionPlaybackReconciliation(
  session: SessionConfig | undefined,
) {
  const validIds = useMemo(() => {
    if (!session) {
      return { exercise: new Set<string>(), rhythm: new Set<string>() };
    }

    return {
      exercise: new Set(
        session.parts.flatMap((part) =>
          part.modules
            .filter(isExerciseLooperPartModule)
            .map((module) => module.id),
        ),
      ),
      rhythm: new Set(
        session.parts.flatMap((part) =>
          part.modules.filter(isRhythmPartModule).map((module) => module.id),
        ),
      ),
    };
  }, [session]);

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
