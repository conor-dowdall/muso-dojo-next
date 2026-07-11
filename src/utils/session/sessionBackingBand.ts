import {
  audioPresets,
  getDefaultAudioPresetId,
  isAudioPresetId,
  isAudioPresetAvailableOn,
} from "@/audio/presets";
import {
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  DEFAULT_RHYTHM_SELECTION,
  normalizeRhythmSelection,
} from "@/utils/rhythm/rhythmConfig";
import { type SessionBackingBandConfig } from "@/types/session";
import { isRecord } from "./normalizationPrimitives";

export const DEFAULT_SESSION_BACKING_BAND_COUNT_IN_BEATS = 4;
export const MIN_SESSION_BACKING_BAND_COUNT_IN_BEATS = 0;
export const MAX_SESSION_BACKING_BAND_COUNT_IN_BEATS = 16;

export function createDefaultSessionBackingBandConfig(): SessionBackingBandConfig {
  return {
    countInBeats: DEFAULT_SESSION_BACKING_BAND_COUNT_IN_BEATS,
    looper: {
      audioPresetId: getDefaultAudioPresetId("exercise"),
      enabled: true,
      octaveOffset: DEFAULT_EXERCISE_OCTAVE_OFFSET,
    },
    rhythm: {
      mode: "automatic",
      selection: DEFAULT_RHYTHM_SELECTION,
    },
  };
}

function normalizeCountInBeats(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_SESSION_BACKING_BAND_COUNT_IN_BEATS &&
    value <= MAX_SESSION_BACKING_BAND_COUNT_IN_BEATS
    ? value
    : DEFAULT_SESSION_BACKING_BAND_COUNT_IN_BEATS;
}

export function normalizeSessionBackingBandConfig(
  value: unknown,
): SessionBackingBandConfig {
  const defaults = createDefaultSessionBackingBandConfig();
  const input = isRecord(value) ? value : {};
  const looper = isRecord(input.looper) ? input.looper : {};
  const rhythm = isRecord(input.rhythm) ? input.rhythm : {};
  const audioPresetId =
    isAudioPresetId(looper.audioPresetId) &&
    isAudioPresetAvailableOn(audioPresets[looper.audioPresetId], "exercise")
      ? looper.audioPresetId
      : defaults.looper.audioPresetId;
  const octaveOffset =
    typeof looper.octaveOffset === "number" &&
    Number.isInteger(looper.octaveOffset) &&
    looper.octaveOffset >= EXERCISE_MIN_OCTAVE_OFFSET &&
    looper.octaveOffset <= EXERCISE_MAX_OCTAVE_OFFSET
      ? looper.octaveOffset
      : defaults.looper.octaveOffset;
  const mode =
    rhythm.mode === "custom" || rhythm.mode === "off"
      ? rhythm.mode
      : "automatic";

  return {
    countInBeats: normalizeCountInBeats(input.countInBeats),
    looper: {
      audioPresetId,
      enabled:
        typeof looper.enabled === "boolean"
          ? looper.enabled
          : defaults.looper.enabled,
      octaveOffset,
    },
    rhythm: {
      mode,
      selection: normalizeRhythmSelection(rhythm.selection),
    },
  };
}

export function getSessionBackingBandConfig(
  value: SessionBackingBandConfig | undefined,
) {
  return normalizeSessionBackingBandConfig(value);
}
