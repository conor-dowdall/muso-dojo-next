import { getDefaultAudioPresetId } from "@/audio/presets";
import {
  DRONE_MAX_OCTAVE_OFFSET,
  DRONE_MAX_NOTE_COUNT,
  DRONE_MIN_OCTAVE_OFFSET,
  DRONE_MIN_NOTE_COUNT,
  resolveDroneNotes,
} from "@/utils/drone/droneNotes";
import { isDronePartModule } from "@/utils/session/partModuleTypes";
import { resolveSettingValue } from "./settingValue";
import {
  findPartById,
  findPartModuleById,
  updatePartById,
  updatePartModuleById,
  updateSessionById,
} from "./sessionGraph";
import { type AppStoreGet, type AppStoreSet, type DroneActions } from "./types";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";

function isValidDroneInteger(value: number, min: number, max: number) {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function createDroneActions(
  set: AppStoreSet,
  get: AppStoreGet,
): DroneActions {
  return {
    updateDroneSettings: (sessionId, partId, moduleId, patch) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            updatePartModuleById(part, moduleId, (partModule) => {
              if (!isDronePartModule(partModule)) {
                return undefined;
              }

              return {
                ...partModule,
                ...patch,
              };
            }),
          ),
        ),
      );
    },
    setDroneAudioPresetId: (sessionId, partId, moduleId, audioPresetId) => {
      const partModule = findPartModuleById(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!isDronePartModule(partModule)) {
        return;
      }

      const defaultAudioPresetId = getDefaultAudioPresetId("drone");
      const currentAudioPresetId =
        partModule.audioPresetId ?? defaultAudioPresetId;
      const nextAudioPresetId = resolveSettingValue(
        audioPresetId,
        currentAudioPresetId,
      );

      if (nextAudioPresetId === currentAudioPresetId) {
        return;
      }

      get().updateDroneSettings(sessionId, partId, moduleId, {
        audioPresetId: nextAudioPresetId,
      });
    },
    setDroneOctaveOffset: (sessionId, partId, moduleId, octaveOffset) => {
      const partModule = findPartModuleById(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!isDronePartModule(partModule)) {
        return;
      }

      const currentOctaveOffset = partModule.octaveOffset ?? 0;
      const nextOctaveOffset = resolveSettingValue(
        octaveOffset,
        currentOctaveOffset,
      );

      if (
        nextOctaveOffset === currentOctaveOffset ||
        !isValidDroneInteger(
          nextOctaveOffset,
          DRONE_MIN_OCTAVE_OFFSET,
          DRONE_MAX_OCTAVE_OFFSET,
        )
      ) {
        return;
      }

      get().updateDroneSettings(sessionId, partId, moduleId, {
        octaveOffset: nextOctaveOffset,
      });
    },
    setDroneNoteCount: (sessionId, partId, moduleId, noteCount) => {
      const part = findPartById(get().sessions[sessionId], partId);
      const partModule = findPartModuleById(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!part || !isDronePartModule(partModule)) {
        return;
      }

      const currentNoteCount = resolveDroneNotes({
        noteCollectionKey: part.noteCollectionKey,
        noteCount: partModule.noteCount,
        octaveOffset: partModule.octaveOffset,
        rootNote: part.rootNote,
      }).noteCount;
      const defaultNoteCount = resolveDroneNotes({
        noteCollectionKey: part.noteCollectionKey,
        octaveOffset: partModule.octaveOffset,
        rootNote: part.rootNote,
      }).noteCount;
      const nextNoteCount = resolveSettingValue(noteCount, currentNoteCount);

      if (
        nextNoteCount === currentNoteCount ||
        !isValidDroneInteger(
          nextNoteCount,
          DRONE_MIN_NOTE_COUNT,
          DRONE_MAX_NOTE_COUNT,
        )
      ) {
        return;
      }

      get().updateDroneSettings(sessionId, partId, moduleId, {
        noteCount:
          nextNoteCount === defaultNoteCount ? undefined : nextNoteCount,
      });
    },
    setDroneWood: (sessionId, partId, moduleId, wood) => {
      const partModule = findPartModuleById(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!isDronePartModule(partModule)) {
        return;
      }

      const currentWood = partModule.wood ?? DEFAULT_WOOD_SURFACE_ID;
      const nextWood = normalizeWoodSurfaceId(
        resolveSettingValue(wood, currentWood),
      );

      if (!nextWood || nextWood === currentWood) {
        return;
      }

      get().updateDroneSettings(sessionId, partId, moduleId, {
        wood: nextWood,
      });
    },
  };
}
