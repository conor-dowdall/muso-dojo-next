import { normalizeAppThemePreference } from "@/data/appThemes";
import {
  defaultInstrumentSetupsAreEqual,
  normalizeMasterAmbienceSetting,
  normalizeDefaultInstrumentSetup,
  normalizeNoteColorSetting,
  noteColorConfigsAreEqual,
} from "@/utils/session/normalizeDojoSettings";
import {
  type AppStoreSet,
  type DojoSettingsActions,
} from "@/stores/app-store/types";
import { type DojoSettings } from "@/types/session";

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
    setDefaultInstrumentSetup: (creationDefault) => {
      const normalizedDefault =
        normalizeDefaultInstrumentSetup(creationDefault);

      setOptionalDojoSetting(
        set,
        "defaultInstrumentSetup",
        normalizedDefault,
        defaultInstrumentSetupsAreEqual,
      );
    },
  };
}
