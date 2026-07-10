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
  beatTransportCoordinator,
  createExercisePlaybackRequest,
  ExerciseAuditionController,
  ensureAudioReady,
  exercisePlaybackRestartRequestsAreEqual,
  exercisePlaybackCoordinator,
  getExercisePlaybackOwner,
  isExercisePlaybackActive,
  musoAudioEngine,
  type AudioPresetId,
  type ExerciseAuditionNote,
  type ExercisePlaybackEvent,
} from "@/audio";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type ExerciseSubdivision } from "@/types/session";
import { type ExerciseCountInBeats } from "@/types/session";

const EXERCISE_AUDITION_DURATION_SECONDS = 0.55;
const EXERCISE_VISUAL_STEP_LEAD_SECONDS = 0.02;
const EXERCISE_VISUAL_STEP_LEAD_MAX_DURATION_RATIO = 0.35;
const EMPTY_AUDITION_ACTIVE_KEYS: ReadonlySet<string> = new Set();

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

function getCurrentPlaybackStepIndex(
  id: string,
  visualStepLeadSeconds: number,
) {
  const outputTime = getCurrentOutputTime();

  return outputTime === undefined
    ? undefined
    : exercisePlaybackCoordinator.getActiveStepIndex(
        outputTime + visualStepLeadSeconds,
        id,
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
  const isPending = snapshot.pendingIds.includes(id);
  const playbackSnapshot = snapshot.playbacks[id];
  const isPlaying = playbackSnapshot !== undefined;
  const isActive = isExercisePlaybackActive(snapshot, id);
  const playbackOwner = getExercisePlaybackOwner(snapshot, id);
  const isBandOwned = playbackOwner === "part-sequence";
  const request = useMemo(
    () =>
      createExercisePlaybackRequest({
        audioPresetId,
        countInBeats: 0 as ExerciseCountInBeats,
        id,
        metronomeEnabled,
        steps,
        subdivision,
        tempoBpm,
      }),
    [audioPresetId, id, metronomeEnabled, steps, subdivision, tempoBpm],
  );
  const events = request.events;
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
      void beatTransportCoordinator.startExercise(nextRequest);
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
    beatTransportCoordinator.stopExercise(id);
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
    if (!isActive) {
      submittedRequest.current = request;
      return;
    }

    if (
      exercisePlaybackRestartRequestsAreEqual(submittedRequest.current, request)
    ) {
      return;
    }

    setActiveStepIndex(undefined);
    submittedRequest.current = request;

    if (!isBandOwned) {
      void beatTransportCoordinator.startExercise(request);
    }
  }, [isActive, isBandOwned, request]);

  useLayoutEffect(() => {
    if (!isPlaying) {
      return;
    }

    exercisePlaybackCoordinator.setMetronomeEnabled(id, metronomeEnabled);
    submittedRequest.current = request;
  }, [id, isPlaying, metronomeEnabled, request]);

  useEffect(() => {
    if (!isPlaying || document.visibilityState === "hidden") {
      return;
    }

    let frameId = 0;
    let lastStepIndex: number | undefined | null = null;

    const commitStepIndex = () => {
      const nextStepIndex = getCurrentPlaybackStepIndex(
        id,
        visualStepLeadSeconds,
      );

      if (nextStepIndex !== lastStepIndex) {
        lastStepIndex = nextStepIndex;
        setActiveStepIndex(nextStepIndex);
      }
    };

    const update = () => {
      commitStepIndex();
      frameId = window.requestAnimationFrame(update);
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [id, isPlaying, visualStepLeadSeconds]);

  useEffect(
    () => musoAudioEngine.subscribeToStopAll(() => auditionController.cancel()),
    [auditionController],
  );

  useEffect(
    () => () => {
      auditionController.dispose();
    },
    [auditionController],
  );

  const renderedActiveStepIndex =
    isPlaying && activeStepIndex === undefined
      ? getCurrentPlaybackStepIndex(id, visualStepLeadSeconds)
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
    playbackSnapshot?.countInBeats !== undefined &&
    playbackSnapshot.countInBeats > 0 &&
    (countInOutputTime === undefined ||
      countInOutputTime < playbackSnapshot.originTime)
      ? playbackSnapshot.countInBeats
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
