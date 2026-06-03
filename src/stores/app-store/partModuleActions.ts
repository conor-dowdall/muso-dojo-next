import { createDefaultPartModuleConfig } from "@/utils/session/createSessionEntities";
import { normalizeDroneOctave } from "@/utils/drone/dronePitch";
import { resolveDroneAudioPresetId } from "@/utils/drone/resolveDroneAudioPreset";
import { isDronePartModule } from "@/utils/session/partModuleTypes";
import { clonePartModuleConfig } from "./cloneConfig";
import { resolveSettingValue } from "./settingValue";
import {
  appendPartModule,
  findPartById,
  findPartModuleById,
  insertPartModuleAfter,
  removePartModuleById,
  updatePartById,
  updatePartModuleById,
  updateSessionById,
} from "./sessionGraph";
import {
  type AppStoreGet,
  type AppStoreSet,
  type PartModuleActions,
} from "./types";

export function createPartModuleActions(
  set: AppStoreSet,
  get: AppStoreGet,
): PartModuleActions {
  return {
    addPartModule: (sessionId, partId, request) => {
      const part = findPartById(get().sessions[sessionId], partId);

      if (!part) {
        return undefined;
      }

      const partModule = createDefaultPartModuleConfig(request);

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            appendPartModule(part, partModule),
          ),
        ),
      );

      return partModule.id;
    },
    clonePartModule: (sessionId, partId, moduleId) => {
      const session = get().sessions[sessionId];
      const part = findPartById(session, partId);
      const partModule = findPartModuleById(session, partId, moduleId);

      if (!part || !partModule) {
        return undefined;
      }

      const clonedModule = clonePartModuleConfig(
        partModule,
        part.modules.map((candidateModule) => candidateModule.id),
      );

      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            insertPartModuleAfter(part, moduleId, clonedModule),
          ),
        ),
      );

      return clonedModule.id;
    },
    removePartModule: (sessionId, partId, moduleId) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            removePartModuleById(part, moduleId),
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

      const currentAudioPresetId = resolveDroneAudioPresetId(
        partModule.audioPresetId,
      );
      const nextAudioPresetId = resolveDroneAudioPresetId(
        resolveSettingValue(audioPresetId, currentAudioPresetId),
      );

      if (nextAudioPresetId === currentAudioPresetId) {
        return;
      }

      get().updateDroneSettings(sessionId, partId, moduleId, {
        audioPresetId: nextAudioPresetId,
      });
    },
    setDroneOctave: (sessionId, partId, moduleId, octave) => {
      const partModule = findPartModuleById(
        get().sessions[sessionId],
        partId,
        moduleId,
      );

      if (!isDronePartModule(partModule)) {
        return;
      }

      const currentOctave = normalizeDroneOctave(partModule.octave);
      const nextOctave = normalizeDroneOctave(
        resolveSettingValue(octave, currentOctave),
      );

      if (nextOctave === currentOctave) {
        return;
      }

      get().updateDroneSettings(sessionId, partId, moduleId, {
        octave: nextOctave,
      });
    },
    updateDroneSettings: (sessionId, partId, moduleId, patch) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            updatePartModuleById(part, moduleId, (partModule) =>
              isDronePartModule(partModule)
                ? {
                    ...partModule,
                    ...patch,
                  }
                : undefined,
            ),
          ),
        ),
      );
    },
  };
}
