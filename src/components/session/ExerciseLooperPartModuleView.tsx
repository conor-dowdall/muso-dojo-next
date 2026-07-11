"use client";

import { useShallow } from "zustand/react/shallow";
import { ExerciseLooperModule } from "@/components/exercise-looper/ExerciseLooperModule";
import { useAppStore } from "@/stores/appStore";
import { selectExerciseLooperPartModule, selectPart } from "./sessionSelectors";
import { isPartBandModule } from "@/utils/music-part/partBand";

export function ExerciseLooperPartModuleView({
  isPerformanceMode = false,
  moduleId,
  onOpenSessionTempo,
  partId,
  sessionId,
}: {
  isPerformanceMode?: boolean;
  moduleId: string;
  onOpenSessionTempo?: (sessionId: string) => void;
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
            isBandSource: isPartBandModule(part, "backingNotes", moduleId),
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
      setExerciseLooperMetronomeEnabled:
        state.setExerciseLooperMetronomeEnabled,
      setExerciseLooperOctaveOffset: state.setExerciseLooperOctaveOffset,
      setExerciseLooperPattern: state.setExerciseLooperPattern,
      setExerciseLooperSubdivision: state.setExerciseLooperSubdivision,
      setExerciseLooperWood: state.setExerciseLooperWood,
      setPartBandSource: state.setPartBandSource,
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
      onMetronomeEnabledChange={(value) =>
        actions.setExerciseLooperMetronomeEnabled(
          sessionId,
          partId,
          moduleId,
          value,
        )
      }
      onOctaveOffsetChange={(value) =>
        actions.setExerciseLooperOctaveOffset(
          sessionId,
          partId,
          moduleId,
          value,
        )
      }
      onPatternChange={(value) =>
        actions.setExerciseLooperPattern(sessionId, partId, moduleId, value)
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => actions.removePartModule(sessionId, partId, moduleId)
      }
      onSubdivisionChange={(value) =>
        actions.setExerciseLooperSubdivision(sessionId, partId, moduleId, value)
      }
      onOpenSessionTempo={
        onOpenSessionTempo ? () => onOpenSessionTempo(sessionId) : undefined
      }
      onUseInBand={
        isPerformanceMode
          ? undefined
          : () =>
              actions.setPartBandSource(sessionId, partId, "backingNotes", {
                mode: "module",
                moduleId,
              })
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
