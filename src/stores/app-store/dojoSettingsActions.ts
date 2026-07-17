import { normalizeAppThemePreference } from "@/data/appThemes";
import {
  moduleCreationDefaultsAreEqual,
  normalizeModuleCreationDefaults,
  normalizeNoteColorSetting,
  noteColorConfigsAreEqual,
} from "@/utils/session/normalizeDojoSettings";
import {
  normalizeSessionMaterialCreationDefaultsForLibrary,
  sessionMaterialCreationDefaultsAreEqual,
} from "@/utils/session/sessionMaterialCreationDefaults";
import {
  type AppStoreSet,
  type DojoSettingsActions,
} from "@/stores/app-store/types";
import {
  type DojoSettings,
  type RememberSessionMaterialCreationRequest,
} from "@/types/session";
import { type RememberModuleCreationRequest } from "@/types/instrument-creation-defaults";
import {
  normalizeSavedFretboardTuningInput,
  savedTuningNameIsAvailable,
} from "@/utils/fretboard/customFretboardTunings";
import { createEntityId } from "@/utils/session/createSessionEntities";
import {
  normalizeSavedChordProgressionInput,
  savedChordProgressionNameIsAvailable,
} from "@/utils/music-theory/customChordProgressions";

function setOptionalDojoSetting<TKey extends keyof DojoSettings>(
  set: AppStoreSet,
  key: TKey,
  value: DojoSettings[TKey] | undefined,
  areEqual: (
    currentValue: DojoSettings[TKey] | undefined,
    nextValue: DojoSettings[TKey] | undefined,
  ) => boolean = Object.is,
) {
  set((state) => {
    if (areEqual(state.dojoSettings[key], value)) {
      return state;
    }

    if (value === undefined) {
      const dojoSettings = { ...state.dojoSettings };
      delete dojoSettings[key];

      return { dojoSettings };
    }

    return {
      dojoSettings: {
        ...state.dojoSettings,
        [key]: value,
      },
    };
  });
}

export function createDojoSettingsActions(
  set: AppStoreSet,
): DojoSettingsActions {
  const rememberModuleCreation = (request: RememberModuleCreationRequest) => {
    set((state) => {
      const moduleCreationDefaults = normalizeModuleCreationDefaults({
        ...state.dojoSettings.moduleCreationDefaults,
        moduleKindDefaults: {
          ...state.dojoSettings.moduleCreationDefaults?.moduleKindDefaults,
          [request.context]: request.moduleKinds,
        },
        ...(request.drone ? { drone: request.drone } : {}),
        ...(request.exerciseLooper
          ? { exerciseLooper: request.exerciseLooper }
          : {}),
        ...(request.fretboard ? { fretboard: request.fretboard } : {}),
        ...(request.keyboard ? { keyboard: request.keyboard } : {}),
        ...(request.rhythm ? { rhythm: request.rhythm } : {}),
      });

      if (
        moduleCreationDefaultsAreEqual(
          state.dojoSettings.moduleCreationDefaults,
          moduleCreationDefaults,
        )
      ) {
        return state;
      }

      if (!moduleCreationDefaults) {
        const dojoSettings = { ...state.dojoSettings };
        delete dojoSettings.moduleCreationDefaults;

        return { dojoSettings };
      }

      return {
        dojoSettings: {
          ...state.dojoSettings,
          moduleCreationDefaults,
        },
      };
    });
  };

  const rememberSessionMaterialCreation = (
    request: RememberSessionMaterialCreationRequest,
  ) => {
    set((state) => {
      const sessionMaterialCreationDefaults =
        normalizeSessionMaterialCreationDefaultsForLibrary(
          {
            ...state.dojoSettings.sessionMaterialCreationDefaults,
            ...request,
          },
          state.dojoSettings.customChordProgressions,
        );

      if (
        sessionMaterialCreationDefaultsAreEqual(
          state.dojoSettings.sessionMaterialCreationDefaults,
          sessionMaterialCreationDefaults,
        )
      ) {
        return state;
      }

      if (!sessionMaterialCreationDefaults) {
        const dojoSettings = { ...state.dojoSettings };
        delete dojoSettings.sessionMaterialCreationDefaults;

        return { dojoSettings };
      }

      return {
        dojoSettings: {
          ...state.dojoSettings,
          sessionMaterialCreationDefaults,
        },
      };
    });
  };

  return {
    addCustomChordProgression: (progressionInput) => {
      const progression = normalizeSavedChordProgressionInput(progressionInput);

      if (!progression) {
        return undefined;
      }

      const id = createEntityId("progression");
      let wasAdded = false;

      set((state) => {
        const customChordProgressions =
          state.dojoSettings.customChordProgressions ?? [];

        if (
          !savedChordProgressionNameIsAvailable(
            customChordProgressions,
            progression.name,
          )
        ) {
          return state;
        }

        wasAdded = true;
        return {
          dojoSettings: {
            ...state.dojoSettings,
            customChordProgressions: [
              ...customChordProgressions,
              { id, ...progression },
            ],
          },
        };
      });

      return wasAdded ? id : undefined;
    },
    updateCustomChordProgression: (progressionId, progressionInput) => {
      const progression = normalizeSavedChordProgressionInput(progressionInput);

      if (!progression) {
        return false;
      }

      let wasUpdated = false;
      set((state) => {
        const customChordProgressions =
          state.dojoSettings.customChordProgressions ?? [];
        const progressionIndex = customChordProgressions.findIndex(
          (candidate) => candidate.id === progressionId,
        );

        if (
          progressionIndex < 0 ||
          !savedChordProgressionNameIsAvailable(
            customChordProgressions,
            progression.name,
            progressionId,
          )
        ) {
          return state;
        }

        const nextProgressions = [...customChordProgressions];
        nextProgressions[progressionIndex] = {
          id: progressionId,
          ...progression,
        };
        wasUpdated = true;

        return {
          dojoSettings: {
            ...state.dojoSettings,
            customChordProgressions: nextProgressions,
          },
        };
      });

      return wasUpdated;
    },
    removeCustomChordProgression: (progressionId) => {
      set((state) => {
        const customChordProgressions =
          state.dojoSettings.customChordProgressions ?? [];
        const nextProgressions = customChordProgressions.filter(
          (progression) => progression.id !== progressionId,
        );

        if (nextProgressions.length === customChordProgressions.length) {
          return state;
        }

        const dojoSettings = { ...state.dojoSettings };
        if (nextProgressions.length === 0) {
          delete dojoSettings.customChordProgressions;
        } else {
          dojoSettings.customChordProgressions = nextProgressions;
        }

        const sessionMaterialCreationDefaults =
          normalizeSessionMaterialCreationDefaultsForLibrary(
            dojoSettings.sessionMaterialCreationDefaults,
            nextProgressions,
          );
        if (sessionMaterialCreationDefaults) {
          dojoSettings.sessionMaterialCreationDefaults =
            sessionMaterialCreationDefaults;
        } else {
          delete dojoSettings.sessionMaterialCreationDefaults;
        }

        return { dojoSettings };
      });
    },
    addCustomFretboardTuning: (tuningInput) => {
      const tuning = normalizeSavedFretboardTuningInput(tuningInput);

      if (!tuning) {
        return undefined;
      }

      const id = createEntityId("tuning");
      let wasAdded = false;

      set((state) => {
        const customFretboardTunings =
          state.dojoSettings.customFretboardTunings ?? [];

        if (
          !savedTuningNameIsAvailable(
            customFretboardTunings,
            tuning.instrument,
            tuning.name,
          )
        ) {
          return state;
        }

        wasAdded = true;
        return {
          dojoSettings: {
            ...state.dojoSettings,
            customFretboardTunings: [
              ...customFretboardTunings,
              { id, ...tuning },
            ],
          },
        };
      });

      return wasAdded ? id : undefined;
    },
    updateCustomFretboardTuning: (tuningId, tuningInput) => {
      const tuning = normalizeSavedFretboardTuningInput(tuningInput);

      if (!tuning) {
        return;
      }

      set((state) => {
        const customFretboardTunings =
          state.dojoSettings.customFretboardTunings ?? [];
        const tuningIndex = customFretboardTunings.findIndex(
          (candidate) => candidate.id === tuningId,
        );

        if (
          tuningIndex < 0 ||
          !savedTuningNameIsAvailable(
            customFretboardTunings,
            tuning.instrument,
            tuning.name,
            tuningId,
          )
        ) {
          return state;
        }

        const nextTunings = [...customFretboardTunings];
        nextTunings[tuningIndex] = { id: tuningId, ...tuning };

        return {
          dojoSettings: {
            ...state.dojoSettings,
            customFretboardTunings: nextTunings,
          },
        };
      });
    },
    removeCustomFretboardTuning: (tuningId) => {
      set((state) => {
        const customFretboardTunings =
          state.dojoSettings.customFretboardTunings ?? [];
        const nextTunings = customFretboardTunings.filter(
          (tuning) => tuning.id !== tuningId,
        );

        if (nextTunings.length === customFretboardTunings.length) {
          return state;
        }

        const dojoSettings = { ...state.dojoSettings };
        if (nextTunings.length === 0) {
          delete dojoSettings.customFretboardTunings;
        } else {
          dojoSettings.customFretboardTunings = nextTunings;
        }

        return { dojoSettings };
      });
    },
    setAppTheme: (themeChoice) => {
      const appTheme = normalizeAppThemePreference(themeChoice);

      setOptionalDojoSetting(set, "appTheme", appTheme);
    },
    setNoteColorConfig: (noteColorConfig) => {
      const normalizedNoteColorConfig =
        normalizeNoteColorSetting(noteColorConfig);

      setOptionalDojoSetting(
        set,
        "noteColorConfig",
        normalizedNoteColorConfig,
        noteColorConfigsAreEqual,
      );
    },
    rememberModuleCreation,
    rememberSessionMaterialCreation,
  };
}
