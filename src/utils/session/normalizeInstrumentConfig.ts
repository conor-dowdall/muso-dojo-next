import { isDisplayFormatId, type DisplayFormatId } from "@/data/displayFormats";
import {
  normalizeFretboardConfig,
  normalizeFretboardThemeName,
} from "@/utils/fretboard/createFretboardConfig";
import { normalizeActiveNotes } from "@/utils/instrument/createActiveNotesConfig";
import { normalizeInstrumentLayoutConfig } from "@/utils/instrument/createInstrumentLayoutConfig";
import { normalizeInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";
import {
  normalizeKeyboardConfig,
  normalizeKeyboardRange,
  normalizeKeyboardThemeName,
} from "@/utils/keyboard/createKeyboardConfig";
import { isInstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import {
  type FretboardInstrumentInstanceConfig,
  type InstrumentInstanceBaseConfig,
  type InstrumentInstanceConfig,
  type KeyboardInstrumentInstanceConfig,
} from "@/types/session";
import { isInstrumentType } from "@/utils/session/partModuleTypes";
import {
  isRecord,
  normalizeOptionalBoolean,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";

function normalizeOptionalDisplayFormatId(
  value: unknown,
): DisplayFormatId | undefined {
  return isDisplayFormatId(value) && value !== "note-names" ? value : undefined;
}

function normalizeInstrumentBaseConfig(
  input: Record<string, unknown>,
): InstrumentInstanceBaseConfig {
  const displayFormatId = normalizeOptionalDisplayFormatId(
    input.displayFormatId,
  );
  const noteEmphasis = isInstrumentNoteEmphasis(input.noteEmphasis)
    ? input.noteEmphasis
    : undefined;
  const activeNotes = normalizeActiveNotes(input.activeNotes);
  const activeNotesLockSourceKey = normalizeString(
    input.activeNotesLockSourceKey,
  );
  const activeNotesLocked =
    input.activeNotesLocked === true &&
    activeNotes !== undefined &&
    activeNotesLockSourceKey !== undefined;
  const layout = normalizeInstrumentLayoutConfig(input.layout);
  const showHeader = normalizeOptionalBoolean(input.showHeader, true);

  return {
    ...(displayFormatId ? { displayFormatId } : {}),
    ...(noteEmphasis && noteEmphasis !== "large" ? { noteEmphasis } : {}),
    ...(activeNotes !== undefined ? { activeNotes } : {}),
    ...(activeNotesLocked ? { activeNotesLocked } : {}),
    ...(activeNotesLocked ? { activeNotesLockSourceKey } : {}),
    ...(layout ? { layout } : {}),
    ...(showHeader !== undefined ? { showHeader } : {}),
  };
}

export function normalizeInstrumentInstanceConfig(
  value: unknown,
): InstrumentInstanceConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (!isInstrumentType(value.type)) {
    return undefined;
  }

  const type = value.type;
  const baseConfig = normalizeInstrumentBaseConfig(value);

  if (type === "fretboard") {
    const theme = normalizeFretboardThemeName(value.theme);
    const config = normalizeFretboardConfig(value.config, theme);
    const audioPresetId = normalizeInstrumentAudioPresetId(
      type,
      value.audioPresetId,
      { fretboardInstrument: config?.instrument },
    );
    const baseInstrumentConfig = {
      ...baseConfig,
      ...(audioPresetId ? { audioPresetId } : {}),
    };

    return {
      ...baseInstrumentConfig,
      type,
      ...(theme ? { theme } : {}),
      ...(config ? { config } : {}),
    } satisfies FretboardInstrumentInstanceConfig;
  }

  const range = normalizeKeyboardRange(value.range);
  const theme = normalizeKeyboardThemeName(value.theme);
  const config = normalizeKeyboardConfig(value.config, range, theme);
  const audioPresetId = normalizeInstrumentAudioPresetId(
    type,
    value.audioPresetId,
  );
  const baseInstrumentConfig = {
    ...baseConfig,
    ...(audioPresetId ? { audioPresetId } : {}),
  };

  return {
    ...baseInstrumentConfig,
    type,
    ...(range ? { range } : {}),
    ...(theme ? { theme } : {}),
    ...(config ? { config } : {}),
  } satisfies KeyboardInstrumentInstanceConfig;
}
