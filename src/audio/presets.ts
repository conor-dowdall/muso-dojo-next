import {
  type AudioPreset,
  type AudioPresetId,
  type AudioUse,
  type DistortionConfig,
  type LowPitchAssistConfig,
  type PitchGainConfig,
} from "./types";

const previewPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.45,
  highMidi: 84,
  highGain: 0.48,
} as const satisfies PitchGainConfig;

const continuousPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.28,
  highMidi: 84,
  highGain: 0.58,
} as const satisfies PitchGainConfig;

const brightPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.2,
  highMidi: 84,
  highGain: 0.42,
} as const satisfies PitchGainConfig;

const lowSpeakerAssist = {
  fullBelowMidi: 42,
  fadeOutMidi: 62,
  partials: [
    { multiple: 2, gain: 0.3 },
    { multiple: 3, gain: 0.26 },
    { multiple: 4, gain: 0.16 },
    { multiple: 5, gain: 0.08 },
    { multiple: 6, gain: 0.035 },
  ],
} as const satisfies LowPitchAssistConfig;

const subtleLowSpeakerAssist = {
  fullBelowMidi: 40,
  fadeOutMidi: 60,
  partials: [
    { multiple: 2, gain: 0.22 },
    { multiple: 3, gain: 0.16 },
    { multiple: 4, gain: 0.08 },
  ],
} as const satisfies LowPitchAssistConfig;

const lightEdge = {
  amount: 0.1,
  mix: 0.18,
  oversample: "2x",
} as const satisfies DistortionConfig;

export const defaultAudioPresetIds = {
  preview: "pluck",
  tuning: "reference-tone",
  drone: "soft-organ",
  exercise: "reference-tone",
} as const satisfies Record<AudioUse, AudioPresetId>;

export const audioPresets = {
  "reference-tone": {
    id: "reference-tone",
    label: "Reference Tone",
    supports: ["preview", "tuning", "drone", "exercise"],
    voice: {
      gain: 0.56,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.025,
        decaySeconds: 0.09,
        sustainGain: 0.82,
        releaseSeconds: 0.2,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.22 },
        { multiple: 3, gain: 0.08 },
        { multiple: 4, gain: 0.03 },
      ],
    },
  },
  pluck: {
    id: "pluck",
    label: "Pluck",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.58,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      distortion: lightEdge,
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 0.96,
        sustainGain: 0.035,
        releaseSeconds: 0.09,
      },
      partials: [
        { multiple: 1, gain: 0.9 },
        { multiple: 2, gain: 0.32 },
        { multiple: 3, gain: 0.16 },
        { multiple: 4, gain: 0.08 },
        { multiple: 5, gain: 0.04 },
        { multiple: 7, gain: 0.018 },
      ],
    },
  },
  piano: {
    id: "piano",
    label: "Piano",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.5,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      distortion: {
        amount: 0.045,
        mix: 0.12,
        oversample: "2x",
      },
      envelope: {
        attackSeconds: 0.002,
        decaySeconds: 0.78,
        sustainGain: 0.065,
        releaseSeconds: 0.14,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.62 },
        { multiple: 3, gain: 0.38 },
        { multiple: 4, gain: 0.24 },
        { multiple: 5, gain: 0.16 },
        { multiple: 6, gain: 0.1 },
        { multiple: 8, gain: 0.055 },
        { multiple: 10, gain: 0.028 },
      ],
    },
  },
  "soft-organ": {
    id: "soft-organ",
    label: "Soft Organ",
    supports: ["preview", "tuning", "drone", "exercise"],
    voice: {
      gain: 0.44,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.08,
        decaySeconds: 0.12,
        sustainGain: 0.78,
        releaseSeconds: 0.44,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.34 },
        { multiple: 3, gain: 0.18 },
        { multiple: 4, gain: 0.08 },
        { multiple: 5, gain: 0.035 },
      ],
    },
  },
  "bright-tone": {
    id: "bright-tone",
    label: "Bright Tone",
    supports: ["preview", "tuning", "exercise"],
    voice: {
      gain: 0.38,
      pitchGain: brightPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      distortion: {
        amount: 0.08,
        mix: 0.2,
        oversample: "2x",
      },
      envelope: {
        attackSeconds: 0.01,
        decaySeconds: 0.07,
        sustainGain: 0.7,
        releaseSeconds: 0.16,
      },
      partials: [
        { multiple: 1, gain: 0.85 },
        { multiple: 2, gain: 0.55 },
        { multiple: 3, gain: 0.32 },
        { multiple: 4, gain: 0.18 },
        { multiple: 5, gain: 0.09 },
        { multiple: 6, gain: 0.045 },
      ],
    },
  },
  "warm-drive": {
    id: "warm-drive",
    label: "Warm Drive",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.46,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      distortion: {
        amount: 0.22,
        mix: 0.45,
        oversample: "4x",
      },
      envelope: {
        attackSeconds: 0.006,
        decaySeconds: 0.9,
        sustainGain: 0.06,
        releaseSeconds: 0.12,
      },
      partials: [
        { multiple: 1, gain: 0.75 },
        { multiple: 2, gain: 0.38 },
        { multiple: 3, gain: 0.22 },
        { multiple: 4, gain: 0.12 },
        { multiple: 5, gain: 0.07 },
        { multiple: 7, gain: 0.035 },
        { multiple: 9, gain: 0.018 },
      ],
    },
  },
} as const satisfies Record<AudioPresetId, AudioPreset>;

export function getDefaultAudioPresetId(use: AudioUse) {
  return defaultAudioPresetIds[use];
}

export function isAudioPresetSupportedForUse(
  preset: AudioPreset,
  use: AudioUse,
) {
  return preset.supports.includes(use);
}

export function resolveAudioPreset(use: AudioUse, presetId?: AudioPresetId) {
  const requestedPreset = presetId ? audioPresets[presetId] : undefined;

  if (requestedPreset && isAudioPresetSupportedForUse(requestedPreset, use)) {
    return requestedPreset;
  }

  return audioPresets[getDefaultAudioPresetId(use)];
}
