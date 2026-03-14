import { type KeyboardConfig } from "@/types/keyboard/keyboard";

export const presets = {
  "2octave": {
    midiRange: [48, 73],
  },
  "3octave": {
    midiRange: [36, 73],
  },
  "4octave": {
    midiRange: [24, 73],
  },
  "5octave": {
    midiRange: [12, 73],
  },
  "6octave": {
    midiRange: [0, 73],
  },
} as const;

export type KeyboardPresetName = keyof typeof presets;

// Helper type for extending presets
export type KeyboardPreset = Partial<KeyboardConfig>;
