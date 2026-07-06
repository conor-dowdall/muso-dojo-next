"use client";

import { useShallow } from "zustand/react/shallow";
import { type AudioPresetId } from "@/audio/types";
import { DroneModule } from "@/components/drone/DroneModule";
import { useAppStore } from "@/stores/appStore";
import { type SettingValue } from "@/types/state";
import { type WoodSurfaceId } from "@/data/woodSurfaces";
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
            noteCount: drone.noteCount,
            noteCollectionKey: part.noteCollectionKey,
            octaveOffset: drone.octaveOffset,
            rootNote: part.rootNote,
            wood: drone.wood,
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
  const setDroneNoteCount = useAppStore((state) => state.setDroneNoteCount);
  const setDroneWood = useAppStore((state) => state.setDroneWood);
  const removePartModule = useAppStore((state) => state.removePartModule);

  if (!model) {
    return null;
  }

  return (
    <DroneModule
      audioPresetId={model.audioPresetId}
      moduleId={moduleId}
      noteCount={model.noteCount}
      noteCollectionKey={model.noteCollectionKey}
      octaveOffset={model.octaveOffset}
      rootNote={model.rootNote}
      wood={model.wood}
      showHeader={!isPerformanceMode}
      onAudioPresetIdChange={
        isPerformanceMode
          ? undefined
          : (audioPresetId: SettingValue<AudioPresetId>) =>
              setDroneAudioPresetId(sessionId, partId, moduleId, audioPresetId)
      }
      onOctaveOffsetChange={(octaveOffset: SettingValue<number>) =>
        setDroneOctaveOffset(sessionId, partId, moduleId, octaveOffset)
      }
      onNoteCountChange={(noteCount: SettingValue<number>) =>
        setDroneNoteCount(sessionId, partId, moduleId, noteCount)
      }
      onWoodChange={
        isPerformanceMode
          ? undefined
          : (wood: SettingValue<WoodSurfaceId>) =>
              setDroneWood(sessionId, partId, moduleId, wood)
      }
      onRemove={
        isPerformanceMode
          ? undefined
          : () => removePartModule(sessionId, partId, moduleId)
      }
    />
  );
}
