import { normalizeAppThemePreference } from "@/data/appThemes";
import {
  moduleCreationDefaultsAreEqual,
  normalizeModuleCreationDefaults,
  normalizeNoteColorSetting,
  noteColorConfigsAreEqual,
} from "@/utils/session/normalizeDojoSettings";
import {
  normalizeSessionMaterialCreationDefaults,
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
        moduleKinds: request.moduleKinds,
        ...(request.drone ? { drone: request.drone } : {}),
        ...(request.exerciseLooper
          ? { exerciseLooper: request.exerciseLooper }
          : {}),
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

  const rememberSessionMaterialCreation = (
    request: RememberSessionMaterialCreationRequest,
  ) => {
    set((state) => {
      const sessionMaterialCreationDefaults =
        normalizeSessionMaterialCreationDefaults({
          ...state.dojoSettings.sessionMaterialCreationDefaults,
          ...request,
        });

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
