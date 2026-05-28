import {
  normalizeDefaultSessionNoteColorConfig,
  noteColorConfigsAreEqual,
} from "@/utils/session/normalizeAppPreferences";
import {
  type AppStoreSet,
  type PreferenceActions,
} from "@/stores/app-store/types";

export function createPreferenceActions(set: AppStoreSet): PreferenceActions {
  return {
    setDefaultSessionNoteColorConfig: (noteColorConfig) => {
      const defaultSessionNoteColorConfig =
        normalizeDefaultSessionNoteColorConfig(noteColorConfig);

      set((state) => {
        if (
          noteColorConfigsAreEqual(
            state.preferences.defaultSessionNoteColorConfig,
            defaultSessionNoteColorConfig,
          )
        ) {
          return state;
        }

        if (!defaultSessionNoteColorConfig) {
          const preferences = { ...state.preferences };
          delete preferences.defaultSessionNoteColorConfig;

          return { preferences };
        }

        return {
          preferences: {
            ...state.preferences,
            defaultSessionNoteColorConfig,
          },
        };
      });
    },
  };
}
