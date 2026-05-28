import { DEFAULT_NOTE_COLOR_CONFIG } from "@/data/noteColors";
import { type SessionNoteColorConfig } from "@/types/note-colors";
import { type AppPreferences } from "@/types/session";
import { normalizeNoteColorConfig } from "@/utils/note-colors/createNoteColorConfig";
import { isRecord } from "@/utils/session/normalizationPrimitives";

function normalizedNoteColorConfig(value: SessionNoteColorConfig | undefined) {
  return normalizeNoteColorConfig(value) ?? DEFAULT_NOTE_COLOR_CONFIG;
}

export function noteColorConfigsAreEqual(
  left: SessionNoteColorConfig | undefined,
  right: SessionNoteColorConfig | undefined,
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

export function normalizeDefaultSessionNoteColorConfig(
  value: unknown,
): SessionNoteColorConfig | undefined {
  const noteColorConfig = normalizeNoteColorConfig(value);

  if (
    !noteColorConfig ||
    noteColorConfigsAreEqual(noteColorConfig, DEFAULT_NOTE_COLOR_CONFIG)
  ) {
    return undefined;
  }

  return noteColorConfig;
}

export function normalizeAppPreferences(value: unknown): AppPreferences {
  if (!isRecord(value)) {
    return {};
  }

  const defaultSessionNoteColorConfig = normalizeDefaultSessionNoteColorConfig(
    value.defaultSessionNoteColorConfig,
  );

  return {
    ...(defaultSessionNoteColorConfig ? { defaultSessionNoteColorConfig } : {}),
  };
}
