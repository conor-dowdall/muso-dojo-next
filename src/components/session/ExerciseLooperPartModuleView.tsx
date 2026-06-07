"use client";

import { useShallow } from "zustand/react/shallow";
import { ExerciseLooperModule } from "@/components/exercise-looper/ExerciseLooperModule";
import { useAppStore } from "@/stores/appStore";
import { DEFAULT_SESSION_COUNT_IN_BEATS } from "@/utils/session/sessionDefaults";
import { selectExerciseLooperPartModule, selectPart } from "./sessionSelectors";

export function ExerciseLooperPartModuleView({
  isPerformanceMode = false,
  moduleId,
  partId,
  sessionId,
}: {
  isPerformanceMode?: boolean;
  moduleId: string;
  partId: string;
  sessionId: string;
}) {
  const model = useAppStore(
    useShallow((state) => {
      const session = state.sessions[sessionId];
      const part = selectPart(state, sessionId, partId);
      const looper = selectExerciseLooperPartModule(
        state,
        sessionId,
        partId,
        moduleId,
      );
      return session && part && looper
        ? {
            ...looper,
            countInBeats:
              session.countInBeats ?? DEFAULT_SESSION_COUNT_IN_BEATS,
            metronomeEnabled: session.metronomeEnabled ?? true,
            noteCollectionKey: part.noteCollectionKey,
            rootNote: part.rootNote,
            tempoBpm: session.tempoBpm ?? 80,
          }
        : undefined;
    }),
  );
  const actions = useAppStore(
    useShallow((state) => ({
      clonePartModule: state.clonePartModule,
      removePartModule: state.removePartModule,
      setExerciseLooperAudioPresetId: state.setExerciseLooperAudioPresetId,
      setExerciseLooperEnd: state.setExerciseLooperEnd,
      setExerciseLooperOctaveOffset: state.setExerciseLooperOctaveOffset,
      setExerciseLooperPattern: state.setExerciseLooperPattern,
      setExerciseLooperStart: state.setExerciseLooperStart,
      setExerciseLooperSubdivision: state.setExerciseLooperSubdivision,
      setExerciseLooperWood: state.setExerciseLooperWood,
    })),
  );

  if (!model) return null;

  return (
    <ExerciseLooperModule
      {...model}
      moduleId={moduleId}
      showHeader={!isPerformanceMode}
      onAudioPresetIdChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setExerciseLooperAudioPresetId(
                sessionId,
                partId,
                moduleId,
                value,
              )
      }
      onClone={
        isPerformanceMode
          ? undefined
          : () => actions.clonePartModule(sessionId, partId, moduleId)
      }
      onEndChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setExerciseLooperEnd(sessionId, partId, moduleId, value)
      }
      onOctaveOffsetChange={(value) =>
        actions.setExerciseLooperOctaveOffset(
          sessionId,
          partId,
          moduleId,
          value,
        )
      }
      onPatternChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setExerciseLooperPattern(
                sessionId,
                partId,
                moduleId,
                value,
              )
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => actions.removePartModule(sessionId, partId, moduleId)
      }
      onStartChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setExerciseLooperStart(sessionId, partId, moduleId, value)
      }
      onSubdivisionChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setExerciseLooperSubdivision(
                sessionId,
                partId,
                moduleId,
                value,
              )
      }
      onWoodChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setExerciseLooperWood(sessionId, partId, moduleId, value)
      }
    />
  );
}
