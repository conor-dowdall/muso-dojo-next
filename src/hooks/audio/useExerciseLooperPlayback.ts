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
  ensureAudioReady,
  exercisePlaybackRestartRequestsAreEqual,
  exercisePlaybackCoordinator,
  getDefaultAudioPresetId,
  isExercisePlaybackActive,
  musoAudioEngine,
  type AudioPresetId,
  type ExerciseAuditionNote,
  type ExercisePlaybackEvent,
} from "@/audio";
import { exerciseSubdivisionBeats } from "@/utils/exercise-looper/exerciseConfig";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type ExerciseSubdivision } from "@/types/session";
import { type ExerciseCountInBeats } from "@/types/session";

const EXERCISE_AUDITION_DURATION_SECONDS = 0.55;
const EXERCISE_VISUAL_STEP_LEAD_SECONDS = 0.02;
const EXERCISE_VISUAL_STEP_LEAD_MAX_DURATION_RATIO = 0.35;
const EMPTY_AUDITION_ACTIVE_KEYS: ReadonlySet<string> = new Set();

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

function getCurrentPlaybackStepIndex(visualStepLeadSeconds: number) {
  const outputTime = getCurrentOutputTime();

  return outputTime === undefined
    ? undefined
    : exercisePlaybackCoordinator.getActiveStepIndex(
        outputTime + visualStepLeadSeconds,
      );
}

function normalizeTempo(tempoBpm: number) {
  return Math.min(300, Math.max(30, Math.round(tempoBpm)));
}

export function getExerciseVisualStepLeadSeconds(
  events: readonly ExercisePlaybackEvent[],
  tempoBpm: number,
) {
  if (events.length === 0) {
    return 0;
  }

  const secondsPerBeat = 60 / normalizeTempo(tempoBpm);
  const shortestStepDurationSeconds = events.reduce(
    (shortestDuration, event) =>
      Math.min(shortestDuration, event.durationBeats * secondsPerBeat),
    Number.POSITIVE_INFINITY,
  );

  if (!Number.isFinite(shortestStepDurationSeconds)) {
    return 0;
  }

  return Math.min(
    EXERCISE_VISUAL_STEP_LEAD_SECONDS,
    shortestStepDurationSeconds * EXERCISE_VISUAL_STEP_LEAD_MAX_DURATION_RATIO,
  );
}

export function useExerciseLooperPlayback({
  audioPresetId,
  id,
  metronomeEnabled,
  steps,
  subdivision,
  tempoBpm,
}: {
  audioPresetId?: AudioPresetId;
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
  const [auditionController] = useState(
    () => new ExerciseAuditionController(musoAudioEngine),
  );
  const auditionActiveKeys = useSyncExternalStore(
    auditionController.subscribe,
    auditionController.getSnapshot,
    auditionController.getSnapshot,
  );
  const isPending = snapshot.pendingId === id;
  const isPlaying = snapshot.playing && snapshot.activeId === id;
  const isActive = isExercisePlaybackActive(snapshot, id);
  const subdivisionBeats = exerciseSubdivisionBeats[subdivision];
  const events = useMemo(
    () => createPlaybackEvents(steps, subdivisionBeats),
    [steps, subdivisionBeats],
  );
  const request = useMemo(
    () => ({
      countInBeats: 0 as ExerciseCountInBeats,
      events,
      id,
      metronomeEnabled,
      presetId: audioPresetId ?? getDefaultAudioPresetId("exercise"),
      tempoBpm,
    }),
    [audioPresetId, events, id, metronomeEnabled, tempoBpm],
  );
  const visualStepLeadSeconds = useMemo(
    () => getExerciseVisualStepLeadSeconds(events, tempoBpm),
    [events, tempoBpm],
  );
  const submittedRequest = useRef(request);

  const startWithCountIn = useCallback(
    (countInBeats: ExerciseCountInBeats) => {
      const nextRequest = { ...request, countInBeats };

      flushSync(() => {
        setActiveStepIndex(undefined);
        auditionController.cancel();
      });
      void ensureAudioReady();
      submittedRequest.current = nextRequest;
      void exercisePlaybackCoordinator.start(nextRequest);
    },
    [auditionController, request],
  );
  const start = useCallback(() => {
    startWithCountIn(0);
  }, [startWithCountIn]);

  const startWithIntro = useCallback(
    (countInBeats: ExerciseCountInBeats) => {
      startWithCountIn(countInBeats);
    },
    [startWithCountIn],
  );
  const stop = useCallback(() => {
    flushSync(() => setActiveStepIndex(undefined));
    exercisePlaybackCoordinator.stop(id);
  }, [id]);
  const auditionNotes = useCallback(
    (notes: readonly ExerciseAuditionNote[]) => {
      void ensureAudioReady();
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
      isActive &&
      !exercisePlaybackRestartRequestsAreEqual(
        submittedRequest.current,
        request,
      )
    ) {
      setActiveStepIndex(undefined);
      submittedRequest.current = request;
      void exercisePlaybackCoordinator.start(request);
    }
  }, [isActive, request]);

  useLayoutEffect(() => {
    if (!isPlaying) {
      return;
    }

    exercisePlaybackCoordinator.setMetronomeEnabled(id, metronomeEnabled);
    exercisePlaybackCoordinator.setTempo(id, tempoBpm);
    submittedRequest.current = request;
  }, [id, isPlaying, metronomeEnabled, request, tempoBpm]);

  useEffect(() => {
    if (!isPlaying || document.visibilityState === "hidden") {
      return;
    }

    let frameId = 0;
    let lastStepIndex: number | undefined | null = null;

    const commitStepIndex = (syncToFrame: boolean) => {
      const nextStepIndex = getCurrentPlaybackStepIndex(visualStepLeadSeconds);

      if (nextStepIndex !== lastStepIndex) {
        lastStepIndex = nextStepIndex;

        if (syncToFrame) {
          // Commit before this animation frame paints so the light does not trail
          // the audible step by an additional browser frame.
          flushSync(() => setActiveStepIndex(nextStepIndex));
          return;
        }

        setActiveStepIndex(nextStepIndex);
      }
    };

    const update = () => {
      commitStepIndex(true);
      frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPlaying, visualStepLeadSeconds]);

  useEffect(
    () => () => {
      auditionController.dispose();
      exercisePlaybackCoordinator.stop(id);
    },
    [auditionController, id],
  );

  const renderedActiveStepIndex =
    isPlaying && activeStepIndex === undefined
      ? getCurrentPlaybackStepIndex(visualStepLeadSeconds)
      : activeStepIndex;
  const activeStep =
    isPlaying && renderedActiveStepIndex !== undefined
      ? steps[renderedActiveStepIndex]
      : undefined;
  const countInOutputTime =
    isPlaying && renderedActiveStepIndex === undefined
      ? getCurrentOutputTime()
      : undefined;
  const activeCountInBeats =
    isPlaying &&
    renderedActiveStepIndex === undefined &&
    snapshot.countInBeats !== undefined &&
    snapshot.countInBeats > 0 &&
    snapshot.originTime !== undefined &&
    (countInOutputTime === undefined || countInOutputTime < snapshot.originTime)
      ? snapshot.countInBeats
      : undefined;
  const activeCollectionPositions = useMemo(
    () =>
      new Set(activeStep?.notes.map((note) => note.collectionPosition) ?? []),
    [activeStep],
  );

  return {
    activeAnchorPosition: activeStep?.notes[0]?.anchorPosition,
    activeCountInBeats,
    activeCollectionPositions,
    audition,
    auditionActiveKeys: isActive
      ? EMPTY_AUDITION_ACTIVE_KEYS
      : auditionActiveKeys,
    auditionChord: auditionNotes,
    isActive,
    isPending,
    isPlaying,
    start,
    startWithIntro,
    stop,
  };
}
