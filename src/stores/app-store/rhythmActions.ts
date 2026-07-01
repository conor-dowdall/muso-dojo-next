import {
  getRhythmSelectionRecipe,
  normalizeRhythmRecipe,
  normalizeRhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import { isRhythmPartModule } from "@/utils/session/partModuleTypes";
import { resolveSettingValue } from "./settingValue";
import {
  findPartModuleById,
  updatePartById,
  updatePartModuleById,
  updateSessionById,
} from "./sessionGraph";
import {
  type AppStoreGet,
  type AppStoreSet,
  type RhythmActions,
} from "./types";

export function createRhythmActions(
  set: AppStoreSet,
  get: AppStoreGet,
): RhythmActions {
  const getRhythmModule = (
    sessionId: string,
    partId: string,
    moduleId: string,
  ) => {
    const partModule = findPartModuleById(
      get().sessions[sessionId],
      partId,
      moduleId,
    );
    return isRhythmPartModule(partModule) ? partModule : undefined;
  };

  return {
    updateRhythmSettings: (sessionId, partId, moduleId, patch) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            updatePartModuleById(part, moduleId, (partModule) =>
              isRhythmPartModule(partModule)
                ? { ...partModule, ...patch }
                : undefined,
            ),
          ),
        ),
      );
    },
    setRhythmRecipe: (sessionId, partId, moduleId, value) => {
      const partModule = getRhythmModule(sessionId, partId, moduleId);
      if (!partModule) return;

      const current = getRhythmSelectionRecipe(partModule.rhythm);
      const next = normalizeRhythmRecipe(resolveSettingValue(value, current));

      get().updateRhythmSettings(sessionId, partId, moduleId, {
        rhythm: normalizeRhythmSelection({
          recipe: next,
          source: "recipe",
        }),
      });
    },
    setRhythmWood: (sessionId, partId, moduleId, value) => {
      const partModule = getRhythmModule(sessionId, partId, moduleId);
      if (!partModule) return;

      const current = partModule.wood ?? DEFAULT_WOOD_SURFACE_ID;
      const next = normalizeWoodSurfaceId(resolveSettingValue(value, current));

      if (next && next !== current) {
        get().updateRhythmSettings(sessionId, partId, moduleId, {
          wood: next,
        });
      }
    },
  };
}
