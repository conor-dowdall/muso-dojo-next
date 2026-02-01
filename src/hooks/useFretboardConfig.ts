import presets, { type FretboardPresetName } from "../configs/fretboards";
import type { FretboardConfig } from "../types/fretboard";

const defaultConfig: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 12],
  rootNote: "C",
  noteCollectionKey: "ionian",
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
  return {
    ...defaultConfig,
    ...(presetCfg ?? {}),
    ...(overrides ?? {}),
  } as FretboardConfig;
}

export default useFretboardConfig;
