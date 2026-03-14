import { presets, type KeyboardPresetName } from "@/configs/keyboard/presets";
import { type KeyboardConfig } from "@/types/keyboard/keyboard";
import { keyboardDefaults } from "@/configs/keyboard/defaults";

/**
 * Creates a fully resolved KeyboardConfig from optional preset and user overrides.
 */
export function createKeyboardConfig(
  preset?: KeyboardPresetName,
  overrides?: KeyboardConfig,
): Required<KeyboardConfig> {
  const presetConfig = preset ? presets[preset] : undefined;

  if (process.env.NODE_ENV === "development" && preset && !presetConfig) {
    console.warn(
      `[createKeyboardConfig] Preset "${preset}" not found. Falling back to default configuration.`,
    );
  }

  return {
    ...keyboardDefaults,
    ...presetConfig,
    ...overrides,
  } as Required<KeyboardConfig>;
}
