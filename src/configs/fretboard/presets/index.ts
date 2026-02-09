import { lightTelecaster } from "./lightTelecaster";
import { darkGibson } from "./darkGibson";

export const presets = {
  lightTelecaster,
  darkGibson,
} as const;

export type FretboardPresetName = keyof typeof presets;
