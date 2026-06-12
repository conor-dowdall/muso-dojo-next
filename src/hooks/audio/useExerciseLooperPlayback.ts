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
  ExerciseAuditionController,
  exercisePlaybackRequestsAreEqual,
  exercisePlaybackCoordinator,
  getDefaultAudioPresetId,
  musoAudioEngine,
  type AudioPresetId,
  type ExerciseAuditionNote,
  type ExercisePlaybackEvent,
} from "@/audio";
import { exerciseSubdivisionBeats } from "@/utils/exercise-looper/exerciseConfig";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type ExerciseSubdivision } from "@/types/session";

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
  const [auditionController] = useState(
    () => new ExerciseAuditionController(musoAudioEngine),
  );
  const auditionActiveKeys = useSyncExternalStore(
    auditionController.subscribe,
    auditionController.getSnapshot,
    auditionController.getSnapshot,
  );
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
  const submittedRequest = useRef(request);

  const start = useCallback(() => {
    auditionController.cancel();
    submittedRequest.current = request;
    void exercisePlaybackCoordinator.start(request);
  }, [auditionController, request]);
  const stop = useCallback(() => {
    exercisePlaybackCoordinator.stop(id);
  }, [id]);
  const auditionNotes = useCallback(
    (notes: readonly ExerciseAuditionNote[]) => {
      void auditionController.audition({
        durationSeconds: EXERCISE_AUDITION_DURATION_SECONDS,
        notes,
        presetId: request.presetId,
        velocity: 0.72,
      });
    },
    [auditionController, request.presetId],
  );
  const audition = useCallback(
    (target: InstrumentNoteInteractionTarget) => auditionNotes([target]),
    [auditionNotes],
  );

  useLayoutEffect(() => {
    if (
      isPlaying &&
      !exercisePlaybackRequestsAreEqual(submittedRequest.current, request)
    ) {
      submittedRequest.current = request;
      void exercisePlaybackCoordinator.start(request);
    }
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
      auditionController.dispose();
      exercisePlaybackCoordinator.stop(id);
    },
    [auditionController, id],
  );

  const activeStep =
    isPlaying && activeStepIndex !== undefined
      ? steps[activeStepIndex]
      : undefined;
  const activeCollectionPositions = useMemo(
    () =>
      new Set(activeStep?.notes.map((note) => note.collectionPosition) ?? []),
    [activeStep],
  );

  return {
    activeAnchorPosition: activeStep?.notes[0]?.anchorPosition,
    activeCollectionPositions,
    audition,
    auditionActiveKeys,
    auditionChord: auditionNotes,
    isPlaying,
    start,
    stop,
  };
}
