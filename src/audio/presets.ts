import {
  type AudioPreset,
  type AudioPresetCategory,
  type AudioPresetId,
  type AudioUse,
  type DistortionConfig,
  type LowPitchAssistConfig,
  type PitchGainConfig,
} from "./types";

const previewPitchGain = {
  referenceMidi: 60,
  lowMidi: 36,
  lowGain: 1.5,
  highMidi: 84,
  highGain: 0.46,
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
  lowGain: 1.18,
  highMidi: 84,
  highGain: 0.34,
} as const satisfies PitchGainConfig;

const lowSpeakerAssist = {
  fullBelowMidi: 42,
  fadeOutMidi: 62,
  partials: [
    { multiple: 2, gain: 0.34 },
    { multiple: 3, gain: 0.28 },
    { multiple: 4, gain: 0.17 },
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
  amount: 0.1,
  mix: 0.18,
  oversample: "2x",
} as const satisfies DistortionConfig;

const tapeEdge = {
  amount: 0.12,
  mix: 0.28,
  oversample: "2x",
} as const satisfies DistortionConfig;

const warmDrive = {
  amount: 0.24,
  mix: 0.46,
  oversample: "4x",
} as const satisfies DistortionConfig;

const fuzzDrive = {
  amount: 0.46,
  mix: 0.64,
  oversample: "4x",
} as const satisfies DistortionConfig;

const brokenDrive = {
  amount: 0.34,
  mix: 0.52,
  oversample: "2x",
} as const satisfies DistortionConfig;

export const defaultAudioPresetIds = {
  preview: "pluck",
  tuning: "reference-tone",
  drone: "soft-organ",
  exercise: "reference-tone",
} as const satisfies Record<AudioUse, AudioPresetId>;

export const audioPresetCategoryOrder = [
  "core",
  "instrument",
  "character",
  "weird",
] as const satisfies readonly AudioPresetCategory[];

export const audioPresetCategoryLabels = {
  core: "Core",
  instrument: "Instrument-ish",
  character: "Character",
  weird: "Weird",
} as const satisfies Record<AudioPresetCategory, string>;

export const audioPresets = {
  "reference-tone": {
    category: "core",
    description: "Plain, steady, and useful for checking pitch.",
    family: "generated",
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
    category: "core",
    description: "Clean, fast, and balanced for fretboards.",
    family: "generated",
    id: "pluck",
    label: "Pluck",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.56,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 0.58,
        sustainGain: 0.018,
        releaseSeconds: 0.055,
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
  "round-pluck": {
    category: "instrument",
    description: "A softer pluck with less bite and a little more body.",
    family: "generated",
    id: "round-pluck",
    label: "Round Pluck",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.6,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      envelope: {
        attackSeconds: 0.006,
        decaySeconds: 0.68,
        sustainGain: 0.035,
        releaseSeconds: 0.08,
      },
      partials: [
        { multiple: 1, gain: 0.94 },
        { multiple: 2, gain: 0.24 },
        { multiple: 3, gain: 0.1 },
        { multiple: 4, gain: 0.04 },
        { multiple: 5, gain: 0.025 },
      ],
    },
  },
  "nylon-ish": {
    category: "instrument",
    description: "Warm string color with a gentle attack.",
    family: "generated",
    id: "nylon-ish",
    label: "Nylon-ish",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.58,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      envelope: {
        attackSeconds: 0.007,
        decaySeconds: 0.74,
        sustainGain: 0.042,
        releaseSeconds: 0.11,
      },
      partials: [
        { multiple: 1, gain: 0.94 },
        { multiple: 2, gain: 0.2 },
        { multiple: 3, gain: 0.12 },
        { multiple: 4, gain: 0.055 },
        { multiple: 5, gain: 0.024 },
        { multiple: 7, gain: 0.012 },
      ],
    },
  },
  piano: {
    category: "core",
    description: "Percussive keys with a quick, musical tail.",
    family: "generated",
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
  "muted-keys": {
    category: "instrument",
    description: "Short, soft keys that stay tidy on dense passages.",
    family: "generated",
    id: "muted-keys",
    label: "Muted Keys",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.56,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      envelope: {
        attackSeconds: 0.003,
        decaySeconds: 0.42,
        sustainGain: 0.045,
        releaseSeconds: 0.09,
      },
      partials: [
        { multiple: 1, gain: 0.86 },
        { multiple: 2, gain: 0.45 },
        { multiple: 3, gain: 0.24 },
        { multiple: 4, gain: 0.12 },
        { multiple: 5, gain: 0.06 },
        { multiple: 7, gain: 0.025 },
      ],
    },
  },
  "tape-keys": {
    category: "character",
    description: "Slightly worn keys with mild drive and detune.",
    family: "generated",
    id: "tape-keys",
    label: "Tape Keys",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.42,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      distortion: tapeEdge,
      unison: {
        detuneCents: [-3, 0, 3],
      },
      envelope: {
        attackSeconds: 0.006,
        decaySeconds: 0.82,
        sustainGain: 0.08,
        releaseSeconds: 0.16,
      },
      partials: [
        { multiple: 1, gain: 0.82 },
        { multiple: 2, gain: 0.48 },
        { multiple: 3, gain: 0.25 },
        { multiple: 4, gain: 0.1 },
        { multiple: 6, gain: 0.04 },
      ],
    },
  },
  "soft-organ": {
    category: "core",
    description: "Smooth sustained tone for drones and held notes.",
    family: "generated",
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
  "reed-organ": {
    category: "instrument",
    description: "Nasal, compact, and useful for melody lines.",
    family: "generated",
    id: "reed-organ",
    label: "Reed Organ",
    supports: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.38,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      distortion: lightEdge,
      envelope: {
        attackSeconds: 0.045,
        decaySeconds: 0.1,
        sustainGain: 0.82,
        releaseSeconds: 0.3,
      },
      partials: [
        { multiple: 1, gain: 0.75 },
        { multiple: 2, gain: 0.15 },
        { multiple: 3, gain: 0.48 },
        { multiple: 4, gain: 0.08 },
        { multiple: 5, gain: 0.28 },
        { multiple: 7, gain: 0.12 },
      ],
    },
  },
  "soft-pad": {
    category: "character",
    description: "Slow, wide, and gentle for sustained harmony.",
    family: "generated",
    id: "soft-pad",
    label: "Soft Pad",
    supports: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.28,
      pitchGain: continuousPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      unison: {
        detuneCents: [-5, 0, 5],
      },
      envelope: {
        attackSeconds: 0.18,
        decaySeconds: 0.24,
        sustainGain: 0.72,
        releaseSeconds: 0.52,
      },
      partials: [
        { multiple: 1, gain: 0.85 },
        { multiple: 2, gain: 0.3 },
        { multiple: 3, gain: 0.14 },
        { multiple: 4, gain: 0.06 },
      ],
    },
  },
  "bright-tone": {
    category: "core",
    description: "Clear, bright, and easy to hear on small speakers.",
    family: "generated",
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
  "glass-bell": {
    category: "instrument",
    description: "Bell-like highs with a clean, ringing decay.",
    family: "generated",
    id: "glass-bell",
    label: "Glass Bell",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.34,
      pitchGain: brightPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.003,
        decaySeconds: 0.95,
        sustainGain: 0.01,
        releaseSeconds: 0.18,
      },
      partials: [
        { multiple: 1, gain: 0.62 },
        { multiple: 2, gain: 0.18 },
        { multiple: 3, gain: 0.06 },
        { multiple: 5, gain: 0.28 },
        { multiple: 8, gain: 0.22 },
        { multiple: 12, gain: 0.12 },
        { multiple: 16, gain: 0.05 },
      ],
    },
  },
  "hollow-synth": {
    category: "character",
    description: "Odd harmonics with a woody, hollow center.",
    family: "generated",
    id: "hollow-synth",
    label: "Hollow Synth",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.42,
      pitchGain: previewPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      unison: {
        detuneCents: [-4, 4],
      },
      envelope: {
        attackSeconds: 0.01,
        decaySeconds: 0.52,
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
  "warm-drive": {
    category: "character",
    description: "Rounded overdrive that thickens low notes.",
    family: "generated",
    id: "warm-drive",
    label: "Warm Drive",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.46,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      distortion: warmDrive,
      envelope: {
        attackSeconds: 0.006,
        decaySeconds: 0.72,
        sustainGain: 0.055,
        releaseSeconds: 0.1,
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
  "fuzz-pluck": {
    category: "character",
    description: "Compressed, buzzy, and deliberately rough.",
    family: "generated",
    id: "fuzz-pluck",
    label: "Fuzz Pluck",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.34,
      pitchGain: previewPitchGain,
      lowPitchAssist: lowSpeakerAssist,
      distortion: fuzzDrive,
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 0.5,
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
  "broken-organ": {
    category: "weird",
    description: "Detuned organ color with unstable, gritty edges.",
    family: "generated",
    id: "broken-organ",
    label: "Broken Organ",
    supports: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.28,
      pitchGain: continuousPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      distortion: brokenDrive,
      unison: {
        detuneCents: [-8, 0, 7],
      },
      envelope: {
        attackSeconds: 0.035,
        decaySeconds: 0.13,
        sustainGain: 0.76,
        releaseSeconds: 0.25,
      },
      partials: [
        { multiple: 1, gain: 0.68 },
        { multiple: 2, gain: 0.18 },
        { multiple: 3, gain: 0.52 },
        { multiple: 4, gain: 0.1 },
        { multiple: 5, gain: 0.28 },
        { multiple: 7, gain: 0.18 },
        { multiple: 11, gain: 0.06 },
      ],
    },
  },
  "detuned-stack": {
    category: "character",
    description: "Wide stacked oscillators with soft motion.",
    family: "generated",
    id: "detuned-stack",
    label: "Detuned Stack",
    supports: ["preview", "drone", "exercise"],
    voice: {
      gain: 0.28,
      pitchGain: previewPitchGain,
      lowPitchAssist: subtleLowSpeakerAssist,
      distortion: {
        amount: 0.06,
        mix: 0.12,
        oversample: "2x",
      },
      unison: {
        detuneCents: [-9, -3, 3, 9],
      },
      envelope: {
        attackSeconds: 0.018,
        decaySeconds: 0.46,
        sustainGain: 0.35,
        releaseSeconds: 0.18,
      },
      partials: [
        { multiple: 1, gain: 0.72 },
        { multiple: 2, gain: 0.28 },
        { multiple: 3, gain: 0.18 },
        { multiple: 5, gain: 0.08 },
      ],
    },
  },
  "bit-glow": {
    category: "weird",
    description: "Sharp digital color with a bright upper shimmer.",
    family: "generated",
    id: "bit-glow",
    label: "Bit Glow",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.32,
      pitchGain: brightPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      distortion: {
        amount: 0.18,
        mix: 0.5,
        oversample: "2x",
      },
      envelope: {
        attackSeconds: 0.002,
        decaySeconds: 0.38,
        sustainGain: 0.16,
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
  "ghost-harmonics": {
    category: "weird",
    description: "Airy upper partials that make low notes speak.",
    family: "generated",
    id: "ghost-harmonics",
    label: "Ghost Harmonics",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.4,
      pitchGain: brightPitchGain,
      lowPitchAssist: harmonicLowSpeakerAssist,
      envelope: {
        attackSeconds: 0.02,
        decaySeconds: 0.86,
        sustainGain: 0.05,
        releaseSeconds: 0.24,
      },
      partials: [
        { multiple: 1, gain: 0.28 },
        { multiple: 2, gain: 0.18 },
        { multiple: 3, gain: 0.08 },
        { multiple: 4, gain: 0.25 },
        { multiple: 5, gain: 0.04 },
        { multiple: 7, gain: 0.18 },
        { multiple: 9, gain: 0.12 },
        { multiple: 12, gain: 0.08 },
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
