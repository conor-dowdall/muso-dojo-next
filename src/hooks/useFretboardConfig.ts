import presets, { type FretboardPresetName } from "@/configs/fretboards";
import type { FretboardConfig } from "@/types/fretboard";

const defaultConfig: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 12],
  darkMode: true,

  showFretLines: true,
  showFretLabels: true,
  fretLabelMarkers: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
  showInlays: true,
  fretLabelAreaHeight: "2rem",

  interactive: true,
};

export function useFretboardConfig(
  preset?: FretboardPresetName,
  overrides?: Partial<FretboardConfig>,
): FretboardConfig {
  const presetCfg = preset ? presets[preset] : undefined;

  if (process.env.NODE_ENV === "development" && preset && !presetCfg) {
    console.warn(
      `[useFretboardConfig] Preset "${preset}" not found. Falling back to default configuration.`,
    );
  }

  return {
    ...defaultConfig,
    ...(presetCfg ?? {}),
    ...(overrides ?? {}),
  } as FretboardConfig;
}

export default useFretboardConfig;
