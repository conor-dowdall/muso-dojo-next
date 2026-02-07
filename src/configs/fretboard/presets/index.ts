import { guitar } from "./guitar";

export const presets = {
  guitar,
} as const;

export type FretboardPresetName = keyof typeof presets;
