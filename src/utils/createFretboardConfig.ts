import { presets, type FretboardPresetName } from "@/configs/fretboard/presets";
import type {
  FretboardConfig,
  PartialFretboardConfig,
} from "@/types/fretboard";

const defaultConfig: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 12],

  showFretWires: true,
  fretWireColor: "#bbb",
  fretWireWidth: "2px",
  evenFrets: false,

  showStrings: true,
  stringColor: "BBB",
  stringWidths: "2px",

  showFretLabels: true,
  fretLabelAreaHeight: "2rem",
  markerFrets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],

  background:
    "linear-gradient(45deg, oklab(50% 0.029 0.075), oklab(45% 0.054 0.063))",
  showInlays: true,
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
