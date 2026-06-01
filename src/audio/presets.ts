import {
  type AudioPreset,
  type AudioPresetCategory,
  type AudioPresetId,
  type AudioUse,
  type ChorusEffectConfig,
  type DistortionEffectConfig,
  type LowPitchAssistConfig,
  type PitchGainConfig,
} from "./types";

const previewPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.42,
  highMidi: 84,
  highGain: 0.48,
} as const satisfies PitchGainConfig;

const continuousPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.24,
  highMidi: 84,
  highGain: 0.58,
} as const satisfies PitchGainConfig;

const brightPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.14,
  highMidi: 84,
  highGain: 0.34,
} as const satisfies PitchGainConfig;

const bassPitchGain = {
  referenceMidi: 48,
  lowMidi: 28,
  lowGain: 1.32,
  highMidi: 76,
  highGain: 0.4,
} as const satisfies PitchGainConfig;

const lowSpeakerAssist = {
  fullBelowMidi: 42,
  fadeOutMidi: 62,
  partials: [
    { multiple: 2, gain: 0.34 },
    { multiple: 3, gain: 0.26 },
    { multiple: 4, gain: 0.16 },
    { multiple: 5, gain: 0.075 },
    { multiple: 6, gain: 0.03 },
  ],
} as const satisfies LowPitchAssistConfig;

const subtleLowSpeakerAssist = {
  fullBelowMidi: 40,
  fadeOutMidi: 60,
  partials: [
    { multiple: 2, gain: 0.2 },
    { multiple: 3, gain: 0.14 },
    { multiple: 4, gain: 0.07 },
  ],
} as const satisfies LowPitchAssistConfig;

const bassLowSpeakerAssist = {
  fullBelowMidi: 43,
  fadeOutMidi: 64,
  partials: [
    { multiple: 2, gain: 0.48 },
    { multiple: 3, gain: 0.26 },
    { multiple: 4, gain: 0.12 },
    { multiple: 5, gain: 0.055 },
  ],
} as const satisfies LowPitchAssistConfig;

const harmonicLowSpeakerAssist = {
  fullBelowMidi: 45,
  fadeOutMidi: 66,
  partials: [
    { multiple: 2, gain: 0.22 },
    { multiple: 3, gain: 0.3 },
    { multiple: 4, gain: 0.2 },
    { multiple: 5, gain: 0.13 },
    { multiple: 7, gain: 0.08 },
  ],
} as const satisfies LowPitchAssistConfig;

const lightEdge = {
  type: "distortion",
  amount: 0.08,
  mix: 0.16,
  oversample: "2x",
} as const satisfies DistortionEffectConfig;

const tapeEdge = {
  type: "distortion",
  amount: 0.13,
  mix: 0.3,
  oversample: "2x",
} as const satisfies DistortionEffectConfig;

const warmDrive = {
  type: "distortion",
  amount: 0.24,
  mix: 0.42,
  oversample: "4x",
} as const satisfies DistortionEffectConfig;

const electricGuitarDrive = {
  type: "distortion",
  amount: 0.36,
  mix: 0.64,
  oversample: "4x",
} as const satisfies DistortionEffectConfig;

const fuzzDrive = {
  type: "distortion",
  amount: 0.48,
  mix: 0.64,
  oversample: "4x",
} as const satisfies DistortionEffectConfig;

const softChorus = {
  type: "chorus",
  delaySeconds: 0.017,
  depthSeconds: 0.004,
  feedback: 0.08,
  mix: 0.18,
  rateHz: 0.32,
} as const satisfies ChorusEffectConfig;

const stringChorus = {
  type: "chorus",
  delaySeconds: 0.014,
  depthSeconds: 0.003,
  feedback: 0.04,
  mix: 0.14,
  rateHz: 0.22,
} as const satisfies ChorusEffectConfig;

export const defaultAudioPresetIds = {
  preview: "piano",
  tuning: "reference-tone",
  drone: "soft-organ",
  exercise: "piano",
} as const satisfies Record<AudioUse, AudioPresetId>;

export const audioPresetCategoryOrder = [
  "core",
  "instrument",
  "character",
  "weird",
] as const satisfies readonly AudioPresetCategory[];

export const audioPresetCategoryLabels = {
  core: "Core",
  instrument: "Instruments",
  character: "Character",
  weird: "Experimental",
} as const satisfies Record<AudioPresetCategory, string>;

export const audioPresets = {
  "reference-tone": {
    category: "core",
    defaultDurationSeconds: 1.1,
    description: "Plain, steady, and useful for checking pitch.",
    family: "generated",
    id: "reference-tone",
    label: "Reference Tone",
    recommendedUses: ["preview", "tuning", "drone", "exercise"],
    voice: {
      gain: 0.54,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.025,
        decaySeconds: 0.08,
        sustainGain: 0.82,
        releaseSeconds: 0.2,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.2 },
        { multiple: 3, gain: 0.07 },
        { multiple: 4, gain: 0.025 },
      ],
    },
  },
  piano: {
    category: "core",
    defaultDurationSeconds: 0.9,
    description: "Clear piano-like attack with a musical synthetic body.",
    family: "generated",
    id: "piano",
    label: "Piano",
    recommendedUses: ["preview", "tuning", "exercise"],
    voice: {
      gain: 0.48,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      insertEffects: [lightEdge],
      envelope: {
        attackSeconds: 0.002,
        decaySeconds: 0.92,
        sustainGain: 0.055,
        releaseSeconds: 0.16,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.58 },
        { multiple: 3, gain: 0.36 },
        { multiple: 4, gain: 0.22 },
        { multiple: 5, gain: 0.14 },
        { multiple: 6, gain: 0.085 },
        { multiple: 8, gain: 0.045 },
        { multiple: 10, gain: 0.02 },
      ],
    },
  },
  "steel-string": {
    category: "core",
    defaultDurationSeconds: 0.72,
    description: "Bright picked string for guitar and general frets.",
    family: "generated",
    id: "steel-string",
    label: "Steel String",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.54,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      envelope: {
        attackSeconds: 0.003,
        decaySeconds: 0.68,
        sustainGain: 0.025,
        releaseSeconds: 0.08,
      },
      partials: [
        { multiple: 1, gain: 0.9 },
        { multiple: 2, gain: 0.34 },
        { multiple: 3, gain: 0.2 },
        { multiple: 4, gain: 0.11 },
        { multiple: 5, gain: 0.055 },
        { multiple: 7, gain: 0.03 },
        { multiple: 9, gain: 0.012 },
      ],
    },
  },
  "distortion-guitar": {
    category: "instrument",
    defaultDurationSeconds: 0.68,
    description: "Direct electric guitar bite with a driven amp-like edge.",
    family: "generated",
    id: "distortion-guitar",
    label: "Distortion Guitar",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.36,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      insertEffects: [electricGuitarDrive],
      envelope: {
        attackSeconds: 0.003,
        decaySeconds: 0.72,
        sustainGain: 0.075,
        releaseSeconds: 0.1,
      },
      partials: [
        { multiple: 1, gain: 0.76 },
        { multiple: 2, gain: 0.48 },
        { multiple: 3, gain: 0.34 },
        { multiple: 4, gain: 0.22 },
        { multiple: 5, gain: 0.15 },
        { multiple: 7, gain: 0.1 },
        { multiple: 9, gain: 0.05 },
        { multiple: 12, gain: 0.025 },
      ],
    },
  },
  "soft-organ": {
    category: "core",
    defaultDurationSeconds: 1.15,
    description: "Smooth sustained tone for drones and held notes.",
    family: "generated",
    id: "soft-organ",
    label: "Soft Organ",
    recommendedUses: ["preview", "tuning", "drone", "exercise"],
    voice: {
      gain: 0.42,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.08,
        decaySeconds: 0.12,
        sustainGain: 0.78,
        releaseSeconds: 0.42,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.32 },
        { multiple: 3, gain: 0.16 },
        { multiple: 4, gain: 0.07 },
        { multiple: 5, gain: 0.03 },
      ],
    },
  },
  "electric-keys": {
    category: "instrument",
    defaultDurationSeconds: 1,
    description: "Rounded electric piano color with a soft edge.",
    family: "generated",
    id: "electric-keys",
    label: "Electric Keys",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.44,
      pitchGain: previewPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      insertEffects: [tapeEdge],
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 1.05,
        sustainGain: 0.12,
        releaseSeconds: 0.22,
      },
      partials: [
        { multiple: 1, gain: 0.86 },
        { multiple: 2, gain: 0.46 },
        { multiple: 3, gain: 0.2 },
        { multiple: 4, gain: 0.16 },
        { multiple: 6, gain: 0.07 },
        { multiple: 8, gain: 0.028 },
      ],
    },
  },
  "nylon-string": {
    category: "instrument",
    defaultDurationSeconds: 0.82,
    description: "Warm plucked string for classical guitar and ukulele.",
    family: "generated",
    id: "nylon-string",
    label: "Nylon String",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.56,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      envelope: {
        attackSeconds: 0.007,
        decaySeconds: 0.86,
        sustainGain: 0.04,
        releaseSeconds: 0.12,
      },
      partials: [
        { multiple: 1, gain: 0.94 },
        { multiple: 2, gain: 0.24 },
        { multiple: 3, gain: 0.12 },
        { multiple: 4, gain: 0.052 },
        { multiple: 5, gain: 0.024 },
        { multiple: 7, gain: 0.01 },
      ],
    },
  },
  "picked-bass": {
    category: "instrument",
    defaultDurationSeconds: 0.72,
    description: "Full picked bass with extra low-end weight and definition.",
    family: "generated",
    id: "picked-bass",
    label: "Picked Bass",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.68,
      pitchGain: bassPitchGain,
      lowPitchAssist: bassLowSpeakerAssist,
      insertEffects: [
        {
          type: "distortion",
          amount: 0.08,
          mix: 0.2,
          oversample: "2x",
        },
      ],
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 0.66,
        sustainGain: 0.13,
        releaseSeconds: 0.12,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.54 },
        { multiple: 3, gain: 0.3 },
        { multiple: 4, gain: 0.16 },
        { multiple: 5, gain: 0.075 },
        { multiple: 6, gain: 0.036 },
      ],
    },
  },
  mandolin: {
    category: "instrument",
    defaultDurationSeconds: 0.5,
    description: "Bright paired-course pluck with a quick treble shimmer.",
    family: "generated",
    id: "mandolin",
    label: "Mandolin",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.42,
      pitchGain: brightPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      unison: {
        detuneCents: [-4.5, 4.5],
      },
      envelope: {
        attackSeconds: 0.0015,
        decaySeconds: 0.36,
        sustainGain: 0.012,
        releaseSeconds: 0.055,
      },
      partials: [
        { multiple: 1, gain: 0.62 },
        { multiple: 2, gain: 0.52 },
        { multiple: 3, gain: 0.37 },
        { multiple: 4, gain: 0.24 },
        { multiple: 5, gain: 0.15 },
        { multiple: 7, gain: 0.09 },
        { multiple: 9, gain: 0.045 },
        { multiple: 12, gain: 0.018 },
      ],
    },
  },
  "bowed-strings": {
    category: "instrument",
    defaultDurationSeconds: 0.92,
    description: "Short bowed string tone for violin, viola, cello, and bass.",
    family: "generated",
    id: "bowed-strings",
    label: "Bowed Strings",
    recommendedUses: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.32,
      pitchGain: continuousPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      insertEffects: [stringChorus],
      unison: {
        detuneCents: [-3, 0, 3],
      },
      envelope: {
        attackSeconds: 0.07,
        decaySeconds: 0.18,
        sustainGain: 0.58,
        releaseSeconds: 0.28,
      },
      partials: [
        { multiple: 1, gain: 0.82 },
        { multiple: 2, gain: 0.38 },
        { multiple: 3, gain: 0.28 },
        { multiple: 4, gain: 0.16 },
        { multiple: 5, gain: 0.09 },
        { multiple: 6, gain: 0.045 },
        { multiple: 8, gain: 0.02 },
      ],
    },
  },
  "bowed-sustain": {
    category: "instrument",
    defaultDurationSeconds: 1.45,
    description: "Longer bowed swell for sustained string color.",
    family: "generated",
    id: "bowed-sustain",
    label: "Long Bow",
    recommendedUses: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.31,
      pitchGain: continuousPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      insertEffects: [stringChorus],
      unison: {
        detuneCents: [-3, 0, 3],
      },
      envelope: {
        attackSeconds: 0.16,
        decaySeconds: 0.22,
        sustainGain: 0.72,
        releaseSeconds: 0.42,
      },
      partials: [
        { multiple: 1, gain: 0.82 },
        { multiple: 2, gain: 0.38 },
        { multiple: 3, gain: 0.28 },
        { multiple: 4, gain: 0.16 },
        { multiple: 5, gain: 0.09 },
        { multiple: 6, gain: 0.045 },
        { multiple: 8, gain: 0.02 },
      ],
    },
  },
  "warm-pad": {
    category: "character",
    defaultDurationSeconds: 1.45,
    description: "Wide, gentle sustain for harmony and drones.",
    family: "generated",
    id: "warm-pad",
    label: "Warm Pad",
    recommendedUses: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.27,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      insertEffects: [softChorus],
      unison: {
        detuneCents: [-6, 0, 6],
      },
      envelope: {
        attackSeconds: 0.22,
        decaySeconds: 0.28,
        sustainGain: 0.74,
        releaseSeconds: 0.58,
      },
      partials: [
        { multiple: 1, gain: 0.85 },
        { multiple: 2, gain: 0.3 },
        { multiple: 3, gain: 0.13 },
        { multiple: 4, gain: 0.05 },
      ],
    },
  },
  "glass-bell": {
    category: "character",
    defaultDurationSeconds: 1.18,
    description: "Clean ringing highs for ear-training accents.",
    family: "generated",
    id: "glass-bell",
    label: "Glass Bell",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.32,
      pitchGain: brightPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.003,
        decaySeconds: 1.08,
        sustainGain: 0.008,
        releaseSeconds: 0.2,
      },
      partials: [
        { multiple: 1, gain: 0.58 },
        { multiple: 2, gain: 0.16 },
        { multiple: 3, gain: 0.055 },
        { multiple: 5, gain: 0.3 },
        { multiple: 8, gain: 0.24 },
        { multiple: 12, gain: 0.12 },
        { multiple: 16, gain: 0.05 },
      ],
    },
  },
  "hollow-synth": {
    category: "weird",
    defaultDurationSeconds: 0.72,
    description: "Odd harmonics with a woody, hollow center.",
    family: "generated",
    id: "hollow-synth",
    label: "Hollow Synth",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.4,
      pitchGain: previewPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      unison: {
        detuneCents: [-4, 4],
      },
      envelope: {
        attackSeconds: 0.01,
        decaySeconds: 0.54,
        sustainGain: 0.12,
        releaseSeconds: 0.12,
      },
      partials: [
        { multiple: 1, gain: 0.8 },
        { multiple: 3, gain: 0.42 },
        { multiple: 5, gain: 0.25 },
        { multiple: 7, gain: 0.13 },
        { multiple: 9, gain: 0.06 },
      ],
    },
  },
  "fuzz-pluck": {
    category: "weird",
    defaultDurationSeconds: 0.58,
    description: "Compressed, buzzy, and deliberately rough.",
    family: "generated",
    id: "fuzz-pluck",
    label: "Fuzz Pluck",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.34,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      insertEffects: [fuzzDrive],
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 0.48,
        sustainGain: 0.045,
        releaseSeconds: 0.08,
      },
      partials: [
        { multiple: 1, gain: 0.68 },
        { multiple: 2, gain: 0.36 },
        { multiple: 3, gain: 0.24 },
        { multiple: 4, gain: 0.16 },
        { multiple: 5, gain: 0.1 },
        { multiple: 7, gain: 0.07 },
        { multiple: 9, gain: 0.03 },
      ],
    },
  },
  "bit-glow": {
    category: "weird",
    defaultDurationSeconds: 0.68,
    description: "Sharp digital color with a bright upper shimmer.",
    family: "generated",
    id: "bit-glow",
    label: "Bit Glow",
    recommendedUses: ["preview", "exercise"],
    voice: {
      gain: 0.32,
      pitchGain: brightPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      insertEffects: [warmDrive],
      envelope: {
        attackSeconds: 0.002,
        decaySeconds: 0.4,
        sustainGain: 0.14,
        releaseSeconds: 0.12,
      },
      partials: [
        { multiple: 1, gain: 0.5 },
        { multiple: 2, gain: 0.3 },
        { multiple: 4, gain: 0.32 },
        { multiple: 8, gain: 0.24 },
        { multiple: 16, gain: 0.14 },
        { multiple: 24, gain: 0.06 },
      ],
    },
  },
} as const satisfies Record<AudioPresetId, AudioPreset>;

export function getDefaultAudioPresetId(use: AudioUse) {
  return defaultAudioPresetIds[use];
}

export function isAudioPresetId(value: unknown): value is AudioPresetId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(audioPresets, value)
  );
}

export function isAudioPresetRecommendedForUse(
  preset: AudioPreset,
  use: AudioUse,
) {
  return preset.recommendedUses.includes(use);
}

export function getAudioPresetsRecommendedForUse(use: AudioUse) {
  return Object.values(audioPresets).filter((preset) =>
    isAudioPresetRecommendedForUse(preset, use),
  );
}

export function resolveAudioPreset(
  presetId: unknown,
  fallbackPresetId: AudioPresetId,
) {
  return isAudioPresetId(presetId)
    ? audioPresets[presetId]
    : audioPresets[fallbackPresetId];
}
