import {
  type AudioPreset,
  type AudioPresetId,
  type AudioPresetSurface,
  type AudioUse,
  type HarmonicVoiceConfig,
  type SamplePackId,
} from "./types";

const sampleVoice = ({
  attackSeconds,
  decaySeconds,
  gain,
  releaseSeconds,
  sustainGain,
}: {
  attackSeconds: number;
  decaySeconds: number;
  gain: number;
  releaseSeconds: number;
  sustainGain: number;
}) =>
  ({
    gain,
    envelope: {
      attackSeconds,
      decaySeconds,
      sustainGain,
      releaseSeconds,
    },
    partials: [{ multiple: 1, gain: 1 }],
  }) as const satisfies HarmonicVoiceConfig;

function createSamplePreset({
  availableOn,
  defaultDurationSeconds,
  description,
  id,
  label,
  samplePackId,
  voice,
}: {
  availableOn: readonly AudioPresetSurface[];
  defaultDurationSeconds: number;
  description: string;
  id: AudioPresetId;
  label: string;
  samplePackId: SamplePackId;
  voice: HarmonicVoiceConfig;
}) {
  return {
    availableOn,
    defaultDurationSeconds,
    description,
    family: "sample",
    id,
    label,
    samplePackId,
    voice,
  } as const satisfies AudioPreset;
}

const pianoVoice = sampleVoice({
  attackSeconds: 0.008,
  decaySeconds: 0.9,
  gain: 0.7,
  releaseSeconds: 0.16,
  sustainGain: 0.02,
});

const pluckedStringVoice = sampleVoice({
  attackSeconds: 0.003,
  decaySeconds: 0.44,
  gain: 0.76,
  releaseSeconds: 0.08,
  sustainGain: 0.04,
});

const bowedStringsVoice = sampleVoice({
  attackSeconds: 0.12,
  decaySeconds: 0.2,
  gain: 0.6,
  releaseSeconds: 0.28,
  sustainGain: 0.78,
});

const canonicalAudioPresets = {
  piano: createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 1.08,
    description: "Clear sampled piano for previews and exercise playback.",
    id: "piano",
    label: "Piano",
    samplePackId: "piano",
    voice: pianoVoice,
  }),
  "plucked-string": createSamplePreset({
    availableOn: ["instrument", "exercise"],
    defaultDurationSeconds: 0.62,
    description: "Sampled nylon pluck for fretted instruments and fast notes.",
    id: "plucked-string",
    label: "Plucked String",
    samplePackId: "plucked-string",
    voice: pluckedStringVoice,
  }),
  "bowed-strings": createSamplePreset({
    availableOn: ["instrument", "drone", "exercise"],
    defaultDurationSeconds: 1.2,
    description: "Looped sampled strings for drones and sustained tones.",
    id: "bowed-strings",
    label: "Bowed Strings",
    samplePackId: "bowed-strings",
    voice: bowedStringsVoice,
  }),
} as const satisfies Record<SamplePackId, AudioPreset>;

const legacyAliasByPresetId = {
  "reference-tone": "piano",
  "distortion-guitar": "plucked-string",
  "picked-bass": "plucked-string",
  mandolin: "plucked-string",
  "soft-organ": "bowed-strings",
  "warm-pad": "bowed-strings",
  "glass-bell": "piano",
  "hollow-synth": "plucked-string",
} as const satisfies Record<
  Exclude<AudioPresetId, keyof typeof canonicalAudioPresets>,
  SamplePackId
>;

function createLegacyAliasPreset(
  id: keyof typeof legacyAliasByPresetId,
): AudioPreset {
  const canonical = canonicalAudioPresets[legacyAliasByPresetId[id]];

  return {
    ...canonical,
    id,
  };
}

export const audioPresets = {
  ...canonicalAudioPresets,
  "reference-tone": createLegacyAliasPreset("reference-tone"),
  "distortion-guitar": createLegacyAliasPreset("distortion-guitar"),
  "picked-bass": createLegacyAliasPreset("picked-bass"),
  mandolin: createLegacyAliasPreset("mandolin"),
  "soft-organ": createLegacyAliasPreset("soft-organ"),
  "warm-pad": createLegacyAliasPreset("warm-pad"),
  "glass-bell": createLegacyAliasPreset("glass-bell"),
  "hollow-synth": createLegacyAliasPreset("hollow-synth"),
} as const satisfies Record<AudioPresetId, AudioPreset>;

export const defaultAudioPresetIds = {
  preview: "piano",
  tuning: "piano",
  drone: "bowed-strings",
  exercise: "piano",
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
