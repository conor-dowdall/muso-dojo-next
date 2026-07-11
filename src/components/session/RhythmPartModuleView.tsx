"use client";

import { useShallow } from "zustand/react/shallow";
import { RhythmModule } from "@/components/rhythm/RhythmModule";
import { useAppStore } from "@/stores/appStore";
import { selectPart, selectRhythmPartModule } from "./sessionSelectors";
import { isPartBandModule } from "@/utils/music-part/partBand";

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
      const part = selectPart(state, sessionId, partId);
      const rhythm = selectRhythmPartModule(state, sessionId, partId, moduleId);

      return session && part && rhythm
        ? {
            ...rhythm,
            isBandSource: isPartBandModule(part, "rhythm", moduleId),
            tempoBpm: session.tempoBpm ?? 80,
          }
        : undefined;
    }),
  );
  const actions = useAppStore(
    useShallow((state) => ({
      clonePartModule: state.clonePartModule,
      removePartModule: state.removePartModule,
      setRhythmRecipe: state.setRhythmRecipe,
      setRhythmWood: state.setRhythmWood,
      setPartBandSource: state.setPartBandSource,
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
      onUseInBand={
        isPerformanceMode
          ? undefined
          : () =>
              actions.setPartBandSource(sessionId, partId, "rhythm", {
                mode: "module",
                moduleId,
              })
      }
      onRhythmRecipeChange={(value) =>
        actions.setRhythmRecipe(sessionId, partId, moduleId, value)
      }
      onWoodChange={(value) =>
        actions.setRhythmWood(sessionId, partId, moduleId, value)
      }
    />
  );
}
