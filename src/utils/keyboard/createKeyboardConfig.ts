import {
  DEFAULT_KEYBOARD_RANGE,
  keyboardRanges,
  normalizeKeyboardRangeName,
  type KeyboardRangeName,
} from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  keyboardThemes,
  normalizeKeyboardThemeName,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
import {
  type KeyboardConfig,
  type ResolvedKeyboardConfig,
} from "@/types/keyboard";
import {
  countWhiteKeys,
  MIDI_MAX,
  MIDI_MIN,
} from "@/utils/keyboard/keyboardGeometry";

const KEYBOARD_DEFAULTS: ResolvedKeyboardConfig = {
  midiRange: keyboardRanges[DEFAULT_KEYBOARD_RANGE].midiRange,
  extendEdgeBlackKeys: true,

  ...keyboardThemes[DEFAULT_KEYBOARD_THEME].config,

  blackKeyHeightPercent: 62,
  blackKeyWidthRatio: 0.58,
};

const CSS_STRING_KEYS = [
  "whiteKeyColor",
  "blackKeyColor",
  "whiteKeyTextColor",
  "blackKeyTextColor",
  "whiteKeyBorderColor",
  "blackKeyBorderColor",
  "keyBorderRadius",
  "whiteKeyShadow",
  "blackKeyShadow",
] satisfies readonly (keyof KeyboardConfig)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDefaultMidiRange(): [number, number] {
  const [startMidi, endMidi] = KEYBOARD_DEFAULTS.midiRange;
  return [startMidi, endMidi];
}

function normalizeMidiRange(
  midiRange: KeyboardConfig["midiRange"],
): [number, number] {
  if (!Array.isArray(midiRange)) {
    return getDefaultMidiRange();
  }

  let [startMidi, endMidi] = midiRange;
  if (!Number.isFinite(startMidi) || !Number.isFinite(endMidi)) {
    return getDefaultMidiRange();
  }

  startMidi = clamp(Math.floor(startMidi), MIDI_MIN, MIDI_MAX);
  endMidi = clamp(Math.floor(endMidi), MIDI_MIN, MIDI_MAX);

  const normalizedRange: [number, number] =
    startMidi <= endMidi ? [startMidi, endMidi] : [endMidi, startMidi];

  return countWhiteKeys(...normalizedRange) > 0
    ? normalizedRange
    : getDefaultMidiRange();
}

function normalizePercent(
  value: KeyboardConfig["blackKeyHeightPercent"],
  fallback: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0, 100)
    : fallback;
}

function normalizePositiveRatio(
  value: KeyboardConfig["blackKeyWidthRatio"],
  fallback: number,
) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.min(value, 1)
    : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function areRangesEqual(
  a: readonly [number, number],
  b: readonly [number, number],
) {
  return a[0] === b[0] && a[1] === b[1];
}

export function normalizeKeyboardRange(
  value: unknown,
): KeyboardRangeName | undefined {
  return normalizeKeyboardRangeName(value);
}

export { normalizeKeyboardThemeName };

/**
 * Returns compact keyboard overrides suitable for persisted workspace state.
 * Defaults, range values, and theme values are omitted so saved settings
 * preserve user intent instead of freezing the resolved render config.
 */
export function normalizeKeyboardConfig(
  overrides: unknown,
  range?: KeyboardRangeName,
  theme?: KeyboardThemeName,
): KeyboardConfig | undefined {
  if (!isRecord(overrides)) {
    return undefined;
  }

  const baseConfig = createKeyboardConfig(range, theme);
  const normalized: KeyboardConfig = {};

  const midiRange = normalizeMidiRange(
    overrides.midiRange as KeyboardConfig["midiRange"],
  );
  if (!areRangesEqual(midiRange, baseConfig.midiRange)) {
    normalized.midiRange = midiRange;
  }

  const extendEdgeBlackKeys = normalizeBoolean(
    overrides.extendEdgeBlackKeys,
    baseConfig.extendEdgeBlackKeys,
  );
  if (extendEdgeBlackKeys !== baseConfig.extendEdgeBlackKeys) {
    normalized.extendEdgeBlackKeys = extendEdgeBlackKeys;
  }

  CSS_STRING_KEYS.forEach((key) => {
    const value = normalizeString(overrides[key]);
    if (value !== undefined && value !== baseConfig[key]) {
      normalized[key] = value;
    }
  });

  const blackKeyHeightPercent = normalizePercent(
    overrides.blackKeyHeightPercent as KeyboardConfig["blackKeyHeightPercent"],
    baseConfig.blackKeyHeightPercent,
  );
  if (blackKeyHeightPercent !== baseConfig.blackKeyHeightPercent) {
    normalized.blackKeyHeightPercent = blackKeyHeightPercent;
  }

  const blackKeyWidthRatio = normalizePositiveRatio(
    overrides.blackKeyWidthRatio as KeyboardConfig["blackKeyWidthRatio"],
    baseConfig.blackKeyWidthRatio,
  );
  if (blackKeyWidthRatio !== baseConfig.blackKeyWidthRatio) {
    normalized.blackKeyWidthRatio = blackKeyWidthRatio;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Creates a fully resolved KeyboardConfig from optional range, theme, and user
 * overrides.
 */
export function createKeyboardConfig(
  range?: KeyboardRangeName,
  theme?: KeyboardThemeName,
  overrides?: KeyboardConfig,
): ResolvedKeyboardConfig {
  const rangeName = normalizeKeyboardRange(range);
  const themeName = normalizeKeyboardThemeName(theme);
  const rangeData = rangeName ? keyboardRanges[rangeName] : undefined;
  const themeConfig = themeName ? keyboardThemes[themeName].config : undefined;
  const rangeConfig: KeyboardConfig | undefined = rangeData
    ? {
        midiRange: rangeData.midiRange,
      }
    : undefined;

  if (process.env.NODE_ENV === "development" && range && !rangeName) {
    console.warn(
      `[createKeyboardConfig] Range "${range}" not found. Falling back to default configuration.`,
    );
  }

  if (process.env.NODE_ENV === "development" && theme && !themeName) {
    console.warn(
      `[createKeyboardConfig] Theme "${theme}" not found. Falling back to default configuration.`,
    );
  }

  const mergedConfig = {
    ...KEYBOARD_DEFAULTS,
    ...themeConfig,
    ...rangeConfig,
    ...overrides,
  } satisfies ResolvedKeyboardConfig;

  return {
    ...mergedConfig,
    midiRange: normalizeMidiRange(mergedConfig.midiRange),
    extendEdgeBlackKeys: normalizeBoolean(
      mergedConfig.extendEdgeBlackKeys,
      KEYBOARD_DEFAULTS.extendEdgeBlackKeys,
    ),
    blackKeyHeightPercent: normalizePercent(
      mergedConfig.blackKeyHeightPercent,
      KEYBOARD_DEFAULTS.blackKeyHeightPercent,
    ),
    blackKeyWidthRatio: normalizePositiveRatio(
      mergedConfig.blackKeyWidthRatio,
      KEYBOARD_DEFAULTS.blackKeyWidthRatio,
    ),
  };
}
