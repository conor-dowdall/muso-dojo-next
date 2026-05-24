import {
  audioPresets,
  isAudioPresetId,
  isAudioPresetSupportedForUse,
} from "@/audio/presets";
import { type AudioPresetId } from "@/audio/types";
import { type InstrumentType } from "@/types/session";

const defaultInstrumentAudioPresetIds = {
  fretboard: "pluck",
  keyboard: "piano",
} as const satisfies Record<InstrumentType, AudioPresetId>;

export function getDefaultInstrumentAudioPresetId(type: InstrumentType) {
  return defaultInstrumentAudioPresetIds[type];
}

export function resolveInstrumentAudioPresetId(
  type: InstrumentType,
  value: unknown,
): AudioPresetId {
  if (!isAudioPresetId(value)) {
    return getDefaultInstrumentAudioPresetId(type);
  }

  const preset = audioPresets[value];

  return isAudioPresetSupportedForUse(preset, "preview")
    ? value
    : getDefaultInstrumentAudioPresetId(type);
}

export function normalizeInstrumentAudioPresetId(
  type: InstrumentType,
  value: unknown,
) {
  const presetId = resolveInstrumentAudioPresetId(type, value);

  return presetId === getDefaultInstrumentAudioPresetId(type)
    ? undefined
    : presetId;
}
