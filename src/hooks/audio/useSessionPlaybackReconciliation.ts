"use client";

import { useEffect, useMemo } from "react";
import {
  createPartSequencePlaybackPlan,
  exercisePlaybackCoordinator,
  rhythmPlaybackCoordinator,
} from "@/audio";
import { type SessionConfig } from "@/types/session";

export function useSessionPlaybackReconciliation(
  session: SessionConfig | undefined,
) {
  const validIds = useMemo(() => {
    if (!session) {
      return { exercise: new Set<string>(), rhythm: new Set<string>() };
    }

    const plan = createPartSequencePlaybackPlan(session);
    return {
      exercise: new Set(
        plan.parts.flatMap((part) =>
          part.exerciseRequests.map((request) => request.id),
        ),
      ),
      rhythm: new Set(
        plan.parts.flatMap((part) =>
          part.rhythmRequests.map((request) => request.id),
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
