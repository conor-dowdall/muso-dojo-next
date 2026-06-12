"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { flushSync } from "react-dom";
import {
  exercisePlaybackCoordinator,
  getDefaultAudioPresetId,
  musoAudioEngine,
  type AudioPresetId,
  type ExercisePlaybackEvent,
} from "@/audio";
import { exerciseSubdivisionBeats } from "@/utils/exercise-looper/exerciseConfig";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type ExerciseSubdivision } from "@/types/session";
import { usePlaybackActiveKeys } from "./usePlaybackActiveKeys";

const EXERCISE_AUDITION_DURATION_SECONDS = 0.55;

function createPlaybackEvents(
  steps: readonly ExerciseSequenceStep[],
  subdivisionBeats: number,
) {
  let offsetBeats = 0;
  const events: ExercisePlaybackEvent[] = [];

  steps.forEach((step, stepIndex) => {
    const durationBeats = step.durationUnits * subdivisionBeats;
    step.notes.forEach((note) => {
      events.push({
        durationBeats,
        midi: note.midi,
        offsetBeats,
        stepIndex,
      });
    });
    offsetBeats += durationBeats;
  });

  return events;
}

function getCurrentOutputTime() {
  const clock = musoAudioEngine.getOutputClock();

  if (!clock) {
    return undefined;
  }

  const currentContextTime = musoAudioEngine.getCurrentTime();
  const elapsedSeconds = Math.max(
    0,
    (performance.now() - clock.performanceTime) / 1000,
  );
  const estimatedOutputTime = clock.contextTime + elapsedSeconds;

  return currentContextTime === undefined
    ? estimatedOutputTime
    : Math.min(estimatedOutputTime, currentContextTime);
}

export function useExerciseLooperPlayback({
  audioPresetId,
  id,
  steps,
  subdivision,
  tempoBpm,
}: {
  audioPresetId?: AudioPresetId;
  id: string;
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
  const {
    activeKeys: auditionActiveKeys,
    attach: attachAudition,
    begin: beginAudition,
    cancel: cancelAudition,
  } = usePlaybackActiveKeys();
  const isPlaying = snapshot.playing && snapshot.activeId === id;
  const subdivisionBeats = exerciseSubdivisionBeats[subdivision];
  const events = useMemo(
    () => createPlaybackEvents(steps, subdivisionBeats),
    [steps, subdivisionBeats],
  );
  const request = useMemo(
    () => ({
      events,
      id,
      presetId: audioPresetId ?? getDefaultAudioPresetId("exercise"),
      tempoBpm,
    }),
    [audioPresetId, events, id, tempoBpm],
  );
  const previousRequest = useRef(request);

  const start = useCallback(() => {
    void exercisePlaybackCoordinator.start(request);
  }, [request]);
  const stop = useCallback(() => {
    exercisePlaybackCoordinator.stop(id);
  }, [id]);
  const audition = useCallback(
    (target: InstrumentNoteInteractionTarget) => {
      const token = beginAudition(target.key);

      void musoAudioEngine
        .playNote({
          durationSeconds: EXERCISE_AUDITION_DURATION_SECONDS,
          midiNote: target.midi,
          presetId: request.presetId,
          use: "exercise",
          velocity: 0.72,
        })
        .then((handle) => {
          if (handle === undefined) {
            cancelAudition(target.key, token);
            return;
          }

          attachAudition(
            target.key,
            token,
            handle,
            EXERCISE_AUDITION_DURATION_SECONDS,
          );
        })
        .catch(() => cancelAudition(target.key, token));
    },
    [attachAudition, beginAudition, cancelAudition, request.presetId],
  );

  useLayoutEffect(() => {
    if (isPlaying && previousRequest.current !== request) {
      void exercisePlaybackCoordinator.start(request);
    }
    previousRequest.current = request;
  }, [isPlaying, request]);

  useEffect(() => {
    if (!isPlaying || document.visibilityState === "hidden") {
      return;
    }

    let frameId = 0;
    let lastStepIndex: number | undefined | null = null;

    const update = () => {
      const outputTime = getCurrentOutputTime();
      const nextStepIndex =
        outputTime === undefined
          ? undefined
          : exercisePlaybackCoordinator.getActiveStepIndex(outputTime);

      if (nextStepIndex !== lastStepIndex) {
        lastStepIndex = nextStepIndex;
        // Commit before this animation frame paints so the light does not trail
        // the audible step by an additional browser frame.
        flushSync(() => setActiveStepIndex(nextStepIndex));
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
    activeAnchorPosition:
      isPlaying && activeStepIndex !== undefined
        ? steps[activeStepIndex]?.notes[0]?.anchorPosition
        : undefined,
    audition,
    auditionActiveKeys,
    isPlaying,
    start,
    stop,
  };
}
