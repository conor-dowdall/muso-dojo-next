"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  exercisePlaybackCoordinator,
  getDefaultAudioPresetId,
  musoAudioEngine,
  type AudioPresetId,
  type ExercisePlaybackEvent,
} from "@/audio";
import { exerciseSubdivisionBeats } from "@/utils/exercise-looper/exerciseConfig";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";
import { type ExerciseSubdivision } from "@/types/session";

function createPlaybackEvents(
  steps: readonly ExerciseSequenceStep[],
  subdivisionBeats: number,
) {
  let offsetBeats = 0;
  const events: ExercisePlaybackEvent[] = [];

  steps.forEach((step, stepIndex) => {
    const durationBeats = step.durationUnits * subdivisionBeats;
    events.push({
      durationBeats,
      midi: step.note.midi,
      offsetBeats,
      stepIndex,
    });
    offsetBeats += durationBeats;
  });

  return events;
}

export function useExerciseLooperPlayback({
  audioPresetId,
  countInBeats,
  id,
  metronomeEnabled,
  steps,
  subdivision,
  tempoBpm,
}: {
  audioPresetId?: AudioPresetId;
  countInBeats: number;
  id: string;
  metronomeEnabled: boolean;
  steps: readonly ExerciseSequenceStep[];
  subdivision: ExerciseSubdivision;
  tempoBpm: number;
}) {
  const snapshot = useSyncExternalStore(
    exercisePlaybackCoordinator.subscribe,
    exercisePlaybackCoordinator.getSnapshot,
    exercisePlaybackCoordinator.getSnapshot,
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>();
  const isPlaying = snapshot.playing && snapshot.activeId === id;
  const subdivisionBeats = exerciseSubdivisionBeats[subdivision];
  const events = useMemo(
    () => createPlaybackEvents(steps, subdivisionBeats),
    [steps, subdivisionBeats],
  );
  const request = useMemo(
    () => ({
      countInBeats,
      events,
      id,
      metronomeEnabled,
      presetId: audioPresetId ?? getDefaultAudioPresetId("exercise"),
      tempoBpm,
    }),
    [audioPresetId, countInBeats, events, id, metronomeEnabled, tempoBpm],
  );
  const restartKey = JSON.stringify(request);
  const previousRestartKey = useRef(restartKey);

  const start = useCallback(() => {
    void exercisePlaybackCoordinator.start(request);
  }, [request]);
  const stop = useCallback(() => {
    exercisePlaybackCoordinator.stop(id);
  }, [id]);
  const audition = useCallback(
    (midi: number) => {
      void musoAudioEngine.playNote({
        durationSeconds: 0.55,
        midiNote: midi,
        presetId: request.presetId,
        use: "exercise",
        velocity: 0.72,
      });
    },
    [request.presetId],
  );

  useEffect(() => {
    if (isPlaying && previousRestartKey.current !== restartKey) {
      void exercisePlaybackCoordinator.start(request);
    }
    previousRestartKey.current = restartKey;
  }, [isPlaying, request, restartKey]);

  useEffect(() => {
    if (!isPlaying || document.visibilityState === "hidden") {
      return;
    }

    let frameId = 0;
    let lastStepIndex: number | undefined;

    const update = () => {
      const outputTime = musoAudioEngine.getOutputClock()?.contextTime;
      const nextStepIndex =
        outputTime === undefined
          ? undefined
          : exercisePlaybackCoordinator.getActiveStepIndex(outputTime);

      if (nextStepIndex !== lastStepIndex) {
        lastStepIndex = nextStepIndex;
        setActiveStepIndex(nextStepIndex);
      }

      frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying]);

  useEffect(
    () => () => {
      exercisePlaybackCoordinator.stop(id);
    },
    [id],
  );

  return {
    activeStepIndex: isPlaying ? activeStepIndex : undefined,
    audition,
    isPlaying,
    start,
    stop,
  };
}
