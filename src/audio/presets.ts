import { type AudioPreset, type AudioPresetId, type AudioUse } from "./types";

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
      gain: 0.68,
      envelope: {
        attackSeconds: 0.03,
        decaySeconds: 0.08,
        sustainGain: 0.9,
        releaseSeconds: 0.22,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.16 },
        { multiple: 3, gain: 0.05 },
      ],
    },
  },
  pluck: {
    id: "pluck",
    label: "Pluck",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.66,
      envelope: {
        attackSeconds: 0.004,
        decaySeconds: 0.82,
        sustainGain: 0.045,
        releaseSeconds: 0.08,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.16 },
        { multiple: 3, gain: 0.04 },
      ],
    },
  },
  piano: {
    id: "piano",
    label: "Piano",
    supports: ["preview", "exercise"],
    voice: {
      gain: 0.58,
      envelope: {
        attackSeconds: 0.002,
        decaySeconds: 0.7,
        sustainGain: 0.08,
        releaseSeconds: 0.12,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.58 },
        { multiple: 3, gain: 0.34 },
        { multiple: 4, gain: 0.2 },
        { multiple: 5, gain: 0.12 },
        { multiple: 6, gain: 0.08 },
        { multiple: 8, gain: 0.04 },
      ],
    },
  },
  "soft-organ": {
    id: "soft-organ",
    label: "Soft Organ",
    supports: ["preview", "tuning", "drone", "exercise"],
    voice: {
      gain: 0.58,
      envelope: {
        attackSeconds: 0.08,
        decaySeconds: 0.12,
        sustainGain: 0.86,
        releaseSeconds: 0.42,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.28 },
        { multiple: 3, gain: 0.12 },
        { multiple: 4, gain: 0.05 },
      ],
    },
  },
  "bright-tone": {
    id: "bright-tone",
    label: "Bright Tone",
    supports: ["preview", "tuning", "exercise"],
    voice: {
      gain: 0.5,
      envelope: {
        attackSeconds: 0.01,
        decaySeconds: 0.06,
        sustainGain: 0.78,
        releaseSeconds: 0.16,
      },
      partials: [
        { multiple: 1, gain: 1 },
        { multiple: 2, gain: 0.42 },
        { multiple: 3, gain: 0.22 },
        { multiple: 4, gain: 0.09 },
        { multiple: 5, gain: 0.04 },
      ],
    },
  },
} as const satisfies Record<AudioPresetId, AudioPreset>;

export function getDefaultAudioPresetId(use: AudioUse) {
  return defaultAudioPresetIds[use];
}

export function resolveAudioPreset(use: AudioUse, presetId?: AudioPresetId) {
  return audioPresets[presetId ?? getDefaultAudioPresetId(use)];
}
