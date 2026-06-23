import {
  type AudioPreset,
  type AudioPresetId,
  type AudioPresetSurface,
  type AudioUse,
  type SampleEnvelopeConfig,
} from "./types";

function createSamplePreset({
  availableOn,
  defaultDurationSeconds,
  description,
  envelope,
  gain,
  id,
  label,
}: {
  availableOn: readonly AudioPresetSurface[];
  defaultDurationSeconds: number;
  description: string;
  envelope: SampleEnvelopeConfig;
  gain: number;
  id: AudioPresetId;
  label: string;
}) {
  return {
    availableOn,
    defaultDurationSeconds,
    description,
    envelope,
    gain,
    id,
    label,
    samplePackId: id,
  } as const satisfies AudioPreset;
}

export const audioPresets = {
  piano: createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 1.08,
    description: "Clear sampled piano for previews and exercise playback.",
    envelope: {
      attackSeconds: 0.008,
      decaySeconds: 0.9,
      releaseSeconds: 0.16,
      sustainGain: 0.02,
    },
    gain: 0.7,
    id: "piano",
    label: "Piano",
  }),
  "plucked-string": createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 0.62,
    description: "Sampled nylon pluck for fretted instruments and fast notes.",
    envelope: {
      attackSeconds: 0.003,
      decaySeconds: 0.44,
      releaseSeconds: 0.08,
      sustainGain: 0.04,
    },
    gain: 0.76,
    id: "plucked-string",
    label: "Plucked String",
  }),
  "bowed-strings": createSamplePreset({
    availableOn: ["instrument", "drone", "exercise"],
    defaultDurationSeconds: 1.2,
    description: "Looped sampled strings for drones and sustained tones.",
    envelope: {
      attackSeconds: 0.12,
      decaySeconds: 0.2,
      releaseSeconds: 0.28,
      sustainGain: 0.78,
    },
    gain: 0.6,
    id: "bowed-strings",
    label: "Bowed Strings",
  }),
} as const satisfies Record<AudioPresetId, AudioPreset>;

export const defaultAudioPresetIds = {
  preview: "piano",
  tuning: "piano",
  drone: "bowed-strings",
  exercise: "plucked-string",
} as const satisfies Record<AudioUse, AudioPresetId>;

const audioPresetOrderBySurface = {
  instrument: ["piano", "plucked-string", "bowed-strings"],
  drone: ["bowed-strings"],
  exercise: ["piano", "plucked-string", "bowed-strings"],
} as const satisfies Record<AudioPresetSurface, readonly AudioPresetId[]>;

export function getDefaultAudioPresetId(use: AudioUse) {
  return defaultAudioPresetIds[use];
}

export function isAudioPresetId(value: unknown): value is AudioPresetId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(audioPresets, value)
  );
}

export function isAudioPresetAvailableOn(
  preset: AudioPreset,
  surface: AudioPresetSurface,
) {
  return preset.availableOn.includes(surface);
}

export function getAudioPresetsForSurface(surface: AudioPresetSurface) {
  return audioPresetOrderBySurface[surface]
    .map((presetId) => audioPresets[presetId])
    .filter((preset) => isAudioPresetAvailableOn(preset, surface));
}

export function resolveAudioPreset(
  presetId: unknown,
  fallbackPresetId: AudioPresetId,
) {
  return isAudioPresetId(presetId)
    ? audioPresets[presetId]
    : audioPresets[fallbackPresetId];
}
