import {
  DEFAULT_MASTER_AMBIENCE_PRESET_ID,
  resolveMasterAmbiencePresetId,
} from "@/audio/masterAmbience";
import { type MasterAmbiencePresetId } from "@/audio/types";
import { normalizeAppThemePreference } from "@/data/appThemes";
import { DEFAULT_NOTE_COLOR_CONFIG } from "@/data/noteColors";
import { type NoteColorConfig } from "@/types/note-colors";
import { type DojoSettings } from "@/types/session";
import { normalizeNoteColorConfig } from "@/utils/note-colors/createNoteColorConfig";
import { isRecord } from "@/utils/session/normalizationPrimitives";
import { normalizeModuleCreationDefaults } from "@/utils/session/normalizeModuleCreationDefaults";
import { normalizeSessionMaterialCreationDefaults } from "@/utils/session/sessionMaterialCreationDefaults";

function normalizedNoteColorConfig(value: NoteColorConfig | undefined) {
  return normalizeNoteColorConfig(value) ?? DEFAULT_NOTE_COLOR_CONFIG;
}

export function noteColorConfigsAreEqual(
  left: NoteColorConfig | undefined,
  right: NoteColorConfig | undefined,
) {
  const normalizedLeft = normalizedNoteColorConfig(left);
  const normalizedRight = normalizedNoteColorConfig(right);

  if (normalizedLeft.source !== normalizedRight.source) {
    return false;
  }

  if (normalizedLeft.source === "theme") {
    return true;
  }

  if (normalizedLeft.source === "preset") {
    return (
      normalizedRight.source === "preset" &&
      normalizedLeft.preset === normalizedRight.preset
    );
  }

  return (
    normalizedRight.source === "custom" &&
    normalizedLeft.name === normalizedRight.name &&
    normalizedLeft.mode === normalizedRight.mode &&
    normalizedLeft.colors.every(
      (color, index) => color === normalizedRight.colors[index],
    )
  );
}

export function normalizeNoteColorSetting(
  value: unknown,
): NoteColorConfig | undefined {
  const noteColorConfig = normalizeNoteColorConfig(value);

  if (
    !noteColorConfig ||
    noteColorConfigsAreEqual(noteColorConfig, DEFAULT_NOTE_COLOR_CONFIG)
  ) {
    return undefined;
  }

  return noteColorConfig;
}

export function normalizeMasterAmbienceSetting(
  value: unknown,
): MasterAmbiencePresetId | undefined {
  const presetId = resolveMasterAmbiencePresetId(value);

  return presetId === DEFAULT_MASTER_AMBIENCE_PRESET_ID ? undefined : presetId;
}

export function normalizeDojoSettings(value: unknown): DojoSettings {
  if (!isRecord(value)) {
    return {};
  }

  const appTheme = normalizeAppThemePreference(value.appTheme);
  const noteColorConfig = normalizeNoteColorSetting(value.noteColorConfig);
  const moduleCreationDefaults = normalizeModuleCreationDefaults(
    value.moduleCreationDefaults,
  );
  const sessionMaterialCreationDefaults =
    normalizeSessionMaterialCreationDefaults(
      value.sessionMaterialCreationDefaults,
    );
  const masterAmbiencePresetId = normalizeMasterAmbienceSetting(
    value.masterAmbiencePresetId,
  );

  return {
    ...(appTheme ? { appTheme } : {}),
    ...(noteColorConfig ? { noteColorConfig } : {}),
    ...(moduleCreationDefaults ? { moduleCreationDefaults } : {}),
    ...(sessionMaterialCreationDefaults
      ? { sessionMaterialCreationDefaults }
      : {}),
    ...(masterAmbiencePresetId ? { masterAmbiencePresetId } : {}),
  };
}

export {
  moduleCreationDefaultsAreEqual,
  normalizeDroneModuleCreationDefault,
  normalizeExerciseLooperModuleCreationDefault,
  normalizeFretboardCreationDefault,
  normalizeFretboardModuleCreationDefault,
  normalizeInstrumentCreationDefault,
  normalizeKeyboardCreationDefault,
  normalizeKeyboardModuleCreationDefault,
  normalizeModuleCreationDefaults,
} from "@/utils/session/normalizeModuleCreationDefaults";
