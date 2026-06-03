"use client";

import { useShallow } from "zustand/react/shallow";
import { DroneModule } from "@/components/drone/DroneModule";
import { useAppStore } from "@/stores/appStore";
import {
  selectDronePartModule,
  selectPart,
} from "@/components/session/sessionSelectors";

interface DronePartModuleViewProps {
  isPerformanceMode?: boolean;
  moduleId: string;
  partId: string;
  sessionId: string;
}

export function DronePartModuleView({
  isPerformanceMode = false,
  moduleId,
  partId,
  sessionId,
}: DronePartModuleViewProps) {
  const model = useAppStore(
    useShallow((state) => {
      const part = selectPart(state, sessionId, partId);
      const drone = selectDronePartModule(state, sessionId, partId, moduleId);

      return part && drone
        ? {
            noteCollectionKey: part.noteCollectionKey,
            rootNote: part.rootNote,
          }
        : undefined;
    }),
  );
  const clonePartModule = useAppStore((state) => state.clonePartModule);
  const removePartModule = useAppStore((state) => state.removePartModule);

  if (!model) {
    return null;
  }

  return (
    <DroneModule
      noteCollectionKey={model.noteCollectionKey}
      rootNote={model.rootNote}
      showHeader={!isPerformanceMode}
      onClone={
        isPerformanceMode
          ? undefined
          : () => clonePartModule(sessionId, partId, moduleId)
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => removePartModule(sessionId, partId, moduleId)
      }
    />
  );
}
