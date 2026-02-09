import { lightTelecaster } from "./lightTelecaster";

export const presets = {
  lightTelecaster,
} as const;

export type FretboardPresetName = keyof typeof presets;
