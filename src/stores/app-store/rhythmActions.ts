import {
  DEFAULT_RHYTHM_PRESET_ID,
  isRhythmPresetId,
  normalizeRhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
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
    setRhythmPresetId: (sessionId, partId, moduleId, value) => {
      const partModule = getRhythmModule(sessionId, partId, moduleId);
      if (!partModule) return;

      const current =
        partModule.rhythm.source === "preset"
          ? partModule.rhythm.presetId
          : partModule.rhythm.basedOnPresetId;
      const next = resolveSettingValue(
        value,
        current ?? DEFAULT_RHYTHM_PRESET_ID,
      );

      if (!isRhythmPresetId(next) || next === current) {
        return;
      }

      get().updateRhythmSettings(sessionId, partId, moduleId, {
        rhythm: normalizeRhythmSelection({
          presetId: next,
          source: "preset",
        }),
      });
    },
  };
}
