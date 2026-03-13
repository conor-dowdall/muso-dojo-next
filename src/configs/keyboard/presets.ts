import { type KeyboardConfig } from "@/types/keyboard/keyboard";

export const presets = {} as const;

export type KeyboardPresetName = keyof typeof presets;

// Helper type for extending presets
export type KeyboardPreset = Partial<KeyboardConfig>;
