import {
  instrumentCreationDefaultsAreEqual,
  normalizeDefaultSessionNoteColorConfig,
  normalizeInstrumentCreationDefault,
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
    setInstrumentCreationDefault: (instrumentType, creationDefault) => {
      const normalizedDefault =
        instrumentType === "keyboard"
          ? normalizeInstrumentCreationDefault("keyboard", creationDefault)
          : normalizeInstrumentCreationDefault("fretboard", creationDefault);

      if (!normalizedDefault) {
        return;
      }

      set((state) => {
        const currentDefaults = state.preferences.instrumentCreationDefaults;
        const nextDefaults = {
          ...currentDefaults,
          [instrumentType]: normalizedDefault,
        };

        if (instrumentCreationDefaultsAreEqual(currentDefaults, nextDefaults)) {
          return state;
        }

        return {
          preferences: {
            ...state.preferences,
            instrumentCreationDefaults: nextDefaults,
          },
        };
      });
    },
  };
}
