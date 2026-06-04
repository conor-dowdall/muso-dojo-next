import { normalizeAppThemePreference } from "@/data/appThemes";
import {
  normalizeMasterAmbienceSetting,
  moduleCreationDefaultsAreEqual,
  normalizeModuleCreationDefaults,
  normalizeNoteColorSetting,
  noteColorConfigsAreEqual,
} from "@/utils/session/normalizeDojoSettings";
import {
  type AppStoreSet,
  type DojoSettingsActions,
} from "@/stores/app-store/types";
import { type DojoSettings } from "@/types/session";
import { type RememberModuleCreationRequest } from "@/types/instrument-creation-defaults";

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
      const moduleKindsKey =
        request.context === "session"
          ? "sessionModuleKinds"
          : "partModuleKinds";
      const moduleCreationDefaults = normalizeModuleCreationDefaults({
        ...state.dojoSettings.moduleCreationDefaults,
        [moduleKindsKey]: request.moduleKinds,
        ...(request.fretboard ? { fretboard: request.fretboard } : {}),
        ...(request.keyboard ? { keyboard: request.keyboard } : {}),
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

  return {
    setAppTheme: (themeChoice) => {
      const appTheme = normalizeAppThemePreference(themeChoice);

      setOptionalDojoSetting(set, "appTheme", appTheme);
    },
    setMasterAmbiencePresetId: (presetId) => {
      const masterAmbiencePresetId = normalizeMasterAmbienceSetting(presetId);

      setOptionalDojoSetting(
        set,
        "masterAmbiencePresetId",
        masterAmbiencePresetId,
      );
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
  };
}
