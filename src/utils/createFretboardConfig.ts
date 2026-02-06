import presets, { type FretboardPresetName } from "@/configs/fretboard/presets";
import themes from "@/configs/fretboard/themes";
import type {
  FretboardConfig,
  FretboardConfigInput,
  FretboardTheme,
} from "@/types/fretboard";

const defaultTheme: FretboardTheme = themes.dark;

const defaultConfig: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 12],

  darkMode: true,
  showFretWires: true,
  showFretLabels: true,
  markerFrets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
  showInlays: true,
  fretLabelAreaHeight: "2rem",
  evenFrets: false,
  theme: defaultTheme,

  interactive: true,
};

/**
 * Creates a fully resolved FretboardConfig from optional preset and user overrides.
 * All string references (preset names, theme names) are resolved to actual objects.
 * The returned config is guaranteed to have theme as a FretboardTheme object (never a string).
 */
export function createFretboardConfig(
  preset?: FretboardPresetName,
  overrides?: Partial<FretboardConfigInput>,
): FretboardConfig {
  const presetCfg = preset ? presets[preset] : undefined;

  if (process.env.NODE_ENV === "development" && preset && !presetCfg) {
    console.warn(
      `[createFretboardConfig] Preset "${preset}" not found. Falling back to default configuration.`,
    );
  }

  let theme: FretboardTheme = { ...defaultTheme };

  const applyTheme = (t?: string | Partial<FretboardTheme>) => {
    if (!t) return;
    if (typeof t === "string") {
      const namedTheme = themes[t];
      if (namedTheme) {
        theme = { ...theme, ...namedTheme };
      }
    } else {
      theme = { ...theme, ...t };
    }
  };

  applyTheme(presetCfg?.theme);
  applyTheme(overrides?.theme);

  return {
    ...defaultConfig,
    ...presetCfg,
    ...overrides,
    theme,
  };
}
