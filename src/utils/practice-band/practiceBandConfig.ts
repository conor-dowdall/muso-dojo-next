import {
  audioPresets,
  getDefaultAudioPresetId,
  isAudioPresetAvailableOn,
  isAudioPresetId,
} from "@/audio/presets";
import { type AudioPresetId } from "@/audio/types";
import { type PracticeBandConfig } from "@/types/session";
import {
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  EXERCISE_MAX_OCTAVE_OFFSET,
  EXERCISE_MIN_OCTAVE_OFFSET,
} from "@/utils/exercise-looper/exerciseConfig";
import { getExerciseBaseOctave } from "@/utils/exercise-looper/exerciseSequence";
import { isRecord } from "@/utils/session/normalizationPrimitives";

export const DEFAULT_PRACTICE_BAND_AUDIO_PRESET_ID =
  getDefaultAudioPresetId("exercise");
export const DEFAULT_PRACTICE_BAND_BACKING_NOTES_ENABLED = true;
export const DEFAULT_PRACTICE_BAND_DRUMS_ENABLED = true;
export const DEFAULT_PRACTICE_BAND_OCTAVE_OFFSET =
  DEFAULT_EXERCISE_OCTAVE_OFFSET;

export interface ResolvedPracticeBandConfig {
  audioPresetId: AudioPresetId;
  backingNotes: boolean;
  drums: boolean;
  octaveOffset: number;
}

export function formatPracticeBandOctave(octaveOffset: number) {
  return `Octave ${getExerciseBaseOctave(octaveOffset)}`;
}

export function normalizePracticeBandAudioPresetId(value: unknown) {
  return isAudioPresetId(value) &&
    isAudioPresetAvailableOn(audioPresets[value], "exercise") &&
    value !== DEFAULT_PRACTICE_BAND_AUDIO_PRESET_ID
    ? value
    : undefined;
}

export function normalizePracticeBandBackingNotes(value: unknown) {
  return typeof value === "boolean" &&
    value !== DEFAULT_PRACTICE_BAND_BACKING_NOTES_ENABLED
    ? value
    : undefined;
}

export function normalizePracticeBandDrums(value: unknown) {
  return typeof value === "boolean" &&
    value !== DEFAULT_PRACTICE_BAND_DRUMS_ENABLED
    ? value
    : undefined;
}

export function normalizePracticeBandOctaveOffset(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= EXERCISE_MIN_OCTAVE_OFFSET &&
    value <= EXERCISE_MAX_OCTAVE_OFFSET &&
    value !== DEFAULT_PRACTICE_BAND_OCTAVE_OFFSET
    ? value
    : undefined;
}

export function normalizePracticeBandConfig(
  value: unknown,
): PracticeBandConfig | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const audioPresetId = normalizePracticeBandAudioPresetId(value.audioPresetId);
  const backingNotes = normalizePracticeBandBackingNotes(value.backingNotes);
  const drums = normalizePracticeBandDrums(value.drums);
  const octaveOffset = normalizePracticeBandOctaveOffset(value.octaveOffset);
  const config = {
    ...(audioPresetId ? { audioPresetId } : {}),
    ...(backingNotes !== undefined ? { backingNotes } : {}),
    ...(drums !== undefined ? { drums } : {}),
    ...(octaveOffset !== undefined ? { octaveOffset } : {}),
  };

  return Object.keys(config).length > 0 ? config : undefined;
}

export function resolvePracticeBandConfig(
  config: PracticeBandConfig | undefined,
): ResolvedPracticeBandConfig {
  return {
    audioPresetId:
      config?.audioPresetId ?? DEFAULT_PRACTICE_BAND_AUDIO_PRESET_ID,
    backingNotes:
      config?.backingNotes ?? DEFAULT_PRACTICE_BAND_BACKING_NOTES_ENABLED,
    drums: config?.drums ?? DEFAULT_PRACTICE_BAND_DRUMS_ENABLED,
    octaveOffset: config?.octaveOffset ?? DEFAULT_PRACTICE_BAND_OCTAVE_OFFSET,
  };
}
