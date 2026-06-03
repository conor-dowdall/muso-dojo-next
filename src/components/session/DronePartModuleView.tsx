"use client";

import { useShallow } from "zustand/react/shallow";
import { DroneModule } from "@/components/drone/DroneModule";
import { useAppStore } from "@/stores/appStore";
import { type SettingValue } from "@/types/state";
import { type AudioPresetId } from "@/audio/types";
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
            octave: drone.octave,
            rootNote: part.rootNote,
          }
        : undefined;
    }),
  );
  const setDroneAudioPresetId = useAppStore(
    (state) => state.setDroneAudioPresetId,
  );
  const setDroneOctave = useAppStore((state) => state.setDroneOctave);
  const clonePartModule = useAppStore((state) => state.clonePartModule);
  const removePartModule = useAppStore((state) => state.removePartModule);

  if (!model) {
    return null;
  }

  return (
    <DroneModule
      audioPresetId={model.audioPresetId}
      octave={model.octave}
      rootNote={model.rootNote}
      showHeader={!isPerformanceMode}
      onAudioPresetIdChange={
        isPerformanceMode
          ? undefined
          : (audioPresetId: SettingValue<AudioPresetId>) =>
              setDroneAudioPresetId(sessionId, partId, moduleId, audioPresetId)
      }
      onClone={
        isPerformanceMode
          ? undefined
          : () => clonePartModule(sessionId, partId, moduleId)
      }
      onOctaveChange={
        isPerformanceMode
          ? undefined
          : (octave: SettingValue<number>) =>
              setDroneOctave(sessionId, partId, moduleId, octave)
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => removePartModule(sessionId, partId, moduleId)
      }
    />
  );
}
