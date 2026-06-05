"use client";

import { useShallow } from "zustand/react/shallow";
import { type AudioPresetId } from "@/audio/types";
import { DroneModule } from "@/components/drone/DroneModule";
import { useAppStore } from "@/stores/appStore";
import { type SettingValue } from "@/types/state";
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
            audioPresetId: drone.audioPresetId,
            noteCollectionKey: part.noteCollectionKey,
            octaveOffset: drone.octaveOffset,
            octaveRowCount: drone.octaveRowCount,
            rootNote: part.rootNote,
          }
        : undefined;
    }),
  );
  const setDroneAudioPresetId = useAppStore(
    (state) => state.setDroneAudioPresetId,
  );
  const setDroneOctaveOffset = useAppStore(
    (state) => state.setDroneOctaveOffset,
  );
  const setDroneOctaveRowCount = useAppStore(
    (state) => state.setDroneOctaveRowCount,
  );
  const removePartModule = useAppStore((state) => state.removePartModule);

  if (!model) {
    return null;
  }

  return (
    <DroneModule
      audioPresetId={model.audioPresetId}
      noteCollectionKey={model.noteCollectionKey}
      octaveOffset={model.octaveOffset}
      octaveRowCount={model.octaveRowCount}
      rootNote={model.rootNote}
      showHeader={!isPerformanceMode}
      onAudioPresetIdChange={
        isPerformanceMode
          ? undefined
          : (audioPresetId: SettingValue<AudioPresetId>) =>
              setDroneAudioPresetId(sessionId, partId, moduleId, audioPresetId)
      }
      onOctaveOffsetChange={
        isPerformanceMode
          ? undefined
          : (octaveOffset: SettingValue<number>) =>
              setDroneOctaveOffset(sessionId, partId, moduleId, octaveOffset)
      }
      onOctaveRowCountChange={
        isPerformanceMode
          ? undefined
          : (octaveRowCount: SettingValue<number>) =>
              setDroneOctaveRowCount(
                sessionId,
                partId,
                moduleId,
                octaveRowCount,
              )
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => removePartModule(sessionId, partId, moduleId)
      }
    />
  );
}
