import { isAudioPresetId } from "@/audio/presets";
import { type AudioPresetId } from "@/audio/types";
import { DEFAULT_DRONE_AUDIO_PRESET_ID } from "@/utils/drone/droneDefaults";

export function resolveDroneAudioPresetId(value: unknown): AudioPresetId {
  return isAudioPresetId(value) ? value : DEFAULT_DRONE_AUDIO_PRESET_ID;
}

export function normalizeDroneAudioPresetId(
  value: unknown,
): AudioPresetId | undefined {
  const resolvedAudioPresetId = resolveDroneAudioPresetId(value);

  return resolvedAudioPresetId === DEFAULT_DRONE_AUDIO_PRESET_ID
    ? undefined
    : resolvedAudioPresetId;
}
