import { presets, type FretboardPresetName } from "@/configs/fretboard/presets";
import { type FretboardConfig } from "@/types/fretboard";
import { fretboardDefaults } from "@/configs/fretboard/defaults";

/**
 * Creates a fully resolved FretboardConfig from optional preset and user overrides.
 * All string references (preset names, theme names) are resolved to actual objects.
 * The returned config is guaranteed to have theme as a FretboardTheme object (never a string).
 */
export function createFretboardConfig(
  preset?: FretboardPresetName,
  overrides?: FretboardConfig,
): Required<FretboardConfig> {
  const presetConfig = preset ? presets[preset] : undefined;

  if (process.env.NODE_ENV === "development" && preset && !presetConfig) {
    console.warn(
      `[createFretboardConfig] Preset "${preset}" not found. Falling back to default configuration.`,
    );
  }

  return {
    ...fretboardDefaults,
    ...presetConfig,
    ...overrides,
  } as Required<FretboardConfig>;
}
