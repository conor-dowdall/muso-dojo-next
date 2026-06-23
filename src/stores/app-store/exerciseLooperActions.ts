import { getDefaultAudioPresetId } from "@/audio/presets";
import {
  DEFAULT_WOOD_SURFACE_ID,
  normalizeWoodSurfaceId,
} from "@/data/woodSurfaces";
import {
  boundariesAreEqual,
  DEFAULT_EXERCISE_COUNT_IN_BEATS,
  DEFAULT_EXERCISE_END,
  DEFAULT_EXERCISE_METRONOME_ENABLED,
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  DEFAULT_EXERCISE_PATTERN,
  DEFAULT_EXERCISE_START,
  DEFAULT_EXERCISE_SUBDIVISION,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
  exercisePatternsAreEqual,
  normalizeExerciseCountInBeats,
} from "@/utils/exercise-looper/exerciseConfig";
import { isExerciseLooperPartModule } from "@/utils/session/partModuleTypes";
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
  type ExerciseLooperActions,
} from "./types";

export function createExerciseLooperActions(
  set: AppStoreSet,
  get: AppStoreGet,
): ExerciseLooperActions {
  const getLooper = (sessionId: string, partId: string, moduleId: string) => {
    const partModule = findPartModuleById(
      get().sessions[sessionId],
      partId,
      moduleId,
    );
    return isExerciseLooperPartModule(partModule) ? partModule : undefined;
  };

  return {
    updateExerciseLooperSettings: (sessionId, partId, moduleId, patch) => {
      set((state) =>
        updateSessionById(state, sessionId, (session) =>
          updatePartById(session, partId, (part) =>
            updatePartModuleById(part, moduleId, (partModule) =>
              isExerciseLooperPartModule(partModule)
                ? { ...partModule, ...patch }
                : undefined,
            ),
          ),
        ),
      );
    },
    setExerciseLooperAudioPresetId: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current =
        partModule.audioPresetId ?? getDefaultAudioPresetId("exercise");
      const next = resolveSettingValue(value, current);
      if (next !== current) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          audioPresetId: next,
        });
      }
    },
    setExerciseLooperCountInBeats: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current =
        partModule.countInBeats ?? DEFAULT_EXERCISE_COUNT_IN_BEATS;
      const next = normalizeExerciseCountInBeats(
        resolveSettingValue(value, current),
      );
      if (next !== undefined && next !== current) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          countInBeats: next,
        });
      }
    },
    setExerciseLooperEnd: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current = partModule.end ?? DEFAULT_EXERCISE_END;
      const next = resolveSettingValue(value, current);
      if (!boundariesAreEqual(next, current)) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          end: next,
        });
      }
    },
    setExerciseLooperMetronomeEnabled: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current =
        partModule.metronomeEnabled ?? DEFAULT_EXERCISE_METRONOME_ENABLED;
      const next = resolveSettingValue(value, current);
      if (next !== current) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          metronomeEnabled: next,
        });
      }
    },
    setExerciseLooperOctaveOffset: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current = partModule.octaveOffset ?? DEFAULT_EXERCISE_OCTAVE_OFFSET;
      const next = resolveSettingValue(value, current);
      if (
        next !== current &&
        Number.isInteger(next) &&
        next >= EXERCISE_MIN_OCTAVE_OFFSET &&
        next <= EXERCISE_MAX_OCTAVE_OFFSET
      ) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          octaveOffset: next,
        });
      }
    },
    setExerciseLooperPattern: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current = partModule.pattern ?? DEFAULT_EXERCISE_PATTERN;
      const next = resolveSettingValue(value, current);
      if (!exercisePatternsAreEqual(next, current)) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          pattern: next,
        });
      }
    },
    setExerciseLooperStart: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current = partModule.start ?? DEFAULT_EXERCISE_START;
      const next = resolveSettingValue(value, current);
      if (!boundariesAreEqual(next, current)) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          start: next,
        });
      }
    },
    setExerciseLooperSubdivision: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current = partModule.subdivision ?? DEFAULT_EXERCISE_SUBDIVISION;
      const next = resolveSettingValue(value, current);
      if (next !== current) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          subdivision: next,
        });
      }
    },
    setExerciseLooperWood: (sessionId, partId, moduleId, value) => {
      const partModule = getLooper(sessionId, partId, moduleId);
      if (!partModule) return;
      const current = partModule.wood ?? DEFAULT_WOOD_SURFACE_ID;
      const next = normalizeWoodSurfaceId(resolveSettingValue(value, current));
      if (next && next !== current) {
        get().updateExerciseLooperSettings(sessionId, partId, moduleId, {
          wood: next,
        });
      }
    },
  };
}
