"use client";

import { useShallow } from "zustand/react/shallow";
import { RhythmModule } from "@/components/rhythm/RhythmModule";
import { useAppStore } from "@/stores/appStore";
import { selectRhythmPartModule } from "./sessionSelectors";

export function RhythmPartModuleView({
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
      const rhythm = selectRhythmPartModule(state, sessionId, partId, moduleId);

      return session && rhythm
        ? {
            ...rhythm,
            tempoBpm: session.tempoBpm ?? 80,
          }
        : undefined;
    }),
  );
  const actions = useAppStore(
    useShallow((state) => ({
      clonePartModule: state.clonePartModule,
      removePartModule: state.removePartModule,
      setRhythmPresetId: state.setRhythmPresetId,
    })),
  );

  if (!model) return null;

  return (
    <RhythmModule
      {...model}
      moduleId={moduleId}
      showHeader={!isPerformanceMode}
      onClone={
        isPerformanceMode
          ? undefined
          : () => actions.clonePartModule(sessionId, partId, moduleId)
      }
      onOpenSessionTempo={
        onOpenSessionTempo ? () => onOpenSessionTempo(sessionId) : undefined
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => actions.removePartModule(sessionId, partId, moduleId)
      }
      onRhythmPresetIdChange={
        isPerformanceMode
          ? undefined
          : (value) =>
              actions.setRhythmPresetId(sessionId, partId, moduleId, value)
      }
    />
  );
}
