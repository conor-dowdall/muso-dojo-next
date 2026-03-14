import { presets, type FretboardPresetName } from "@/configs/fretboard/presets";
import { type FretboardConfig } from "@/types/fretboard/fretboard";
import { fretboardDefaults } from "@/configs/fretboard/defaults";

/**
 * Creates a fully resolved FretboardConfig from optional preset and user overrides.
 * Preset name is resolved to an actual stored object, if it exists.
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
