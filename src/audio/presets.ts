import {
  type AudioPreset,
  type AudioPresetId,
  type AudioPresetSurface,
  type AudioUse,
  type SampleEnvelopeConfig,
} from "./types";

function createSamplePreset({
  attackSecondsByUse,
  availableOn,
  defaultDurationSeconds,
  envelope,
  gain,
  id,
  instrumentPreviewDurationSeconds,
  label,
}: {
  attackSecondsByUse?: Partial<Record<AudioUse, number>>;
  availableOn: readonly AudioPresetSurface[];
  defaultDurationSeconds: number;
  envelope: SampleEnvelopeConfig;
  gain: number;
  id: AudioPresetId;
  instrumentPreviewDurationSeconds?: number;
  label: string;
}) {
  return {
    ...(attackSecondsByUse ? { attackSecondsByUse } : {}),
    availableOn,
    defaultDurationSeconds,
    envelope,
    gain,
    id,
    ...(instrumentPreviewDurationSeconds === undefined
      ? {}
      : { instrumentPreviewDurationSeconds }),
    label,
    samplePackId: id,
  } as const satisfies AudioPreset;
}

export const audioPresets = {
  piano: createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 1.08,
    envelope: {
      attackSeconds: 0.008,
      decaySeconds: 0.9,
      releaseSeconds: 0.16,
      sustainGain: 0.02,
    },
    gain: 0.7,
    id: "piano",
    // Instrument previews add the 0.16s release, for a 0.90s total voice.
    instrumentPreviewDurationSeconds: 0.74,
    label: "Piano",
  }),
  "plucked-string": createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 0.62,
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
  "acoustic-bass": createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 0.9,
    envelope: {
      attackSeconds: 0.003,
      decaySeconds: 0.7,
      releaseSeconds: 0.12,
      sustainGain: 0.04,
    },
    gain: 0.82,
    id: "acoustic-bass",
    // Instrument previews add the 0.12s release, for a 0.88s total voice.
    instrumentPreviewDurationSeconds: 0.76,
    label: "Acoustic Bass",
  }),
  "bowed-strings": createSamplePreset({
    attackSecondsByUse: { exercise: 0.045 },
    availableOn: ["instrument", "drone", "exercise"],
    defaultDurationSeconds: 1.2,
    envelope: {
      attackSeconds: 0.12,
      decaySeconds: 0.2,
      releaseSeconds: 0.28,
      sustainGain: 0.78,
    },
    gain: 0.6,
    id: "bowed-strings",
    // Instrument previews add the 0.28s release, for a 1.05s total voice.
    instrumentPreviewDurationSeconds: 0.77,
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
  instrument: ["piano", "plucked-string", "acoustic-bass", "bowed-strings"],
  drone: ["bowed-strings"],
  exercise: ["piano", "plucked-string", "acoustic-bass", "bowed-strings"],
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
