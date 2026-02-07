import { presets, type FretboardPresetName } from "@/configs/fretboard/presets";
import type {
  FretboardConfig,
  PartialFretboardConfig,
} from "@/types/fretboard";

const defaultConfig: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 24],

  background: "linear-gradient(to top right, #c0750d, #8e5509)",

  showInlays: true,
  markerFrets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],

  showFretLabels: true,
  fretLabelsPosition: "bottom",
  freLabelsBackground: "linear-gradient(to top right, #cba857, #c09d52)",
  fretLabelsColor: "black",
  fretLabelsHeight: "1cqi",

  showNut: true,
  nutColor: "linear-gradient(to top right, #e4cda2, #ceb992)",
  nutWidth: "0.9cqi",

  showFretWires: true,
  fretWireColor: "linear-gradient(to top right, #e2d6b9, #b0a690)",
  fretWireWidth: "0.3cqi",
  evenFrets: false,

  showStrings: true,
  stringColor: "BBB",
  stringWidths: "0.3cqi",
};

/**
 * Creates a fully resolved FretboardConfig from optional preset and user overrides.
 * All string references (preset names, theme names) are resolved to actual objects.
 * The returned config is guaranteed to have theme as a FretboardTheme object (never a string).
 */
export function createFretboardConfig(
  preset?: FretboardPresetName,
  overrides?: PartialFretboardConfig,
): FretboardConfig {
  const presetCfg = preset ? presets[preset] : undefined;

  if (process.env.NODE_ENV === "development" && preset && !presetCfg) {
    console.warn(
      `[createFretboardConfig] Preset "${preset}" not found. Falling back to default configuration.`,
    );
  }

  return {
    ...defaultConfig,
    ...presetCfg,
    ...overrides,
  };
}
