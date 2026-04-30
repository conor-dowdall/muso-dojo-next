import {
  stringInstruments,
  stringInstrumentTunings,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { fretboardIconNames, type FretboardIcon } from "@/data/fretboard/icons";
import {
  DEFAULT_FRETBOARD_THEME,
  fretboardThemes,
  normalizeFretboardThemeName,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import {
  type FretboardConfig,
  type ResolvedFretboardConfig,
  type FretboardStringTexture,
} from "@/types/fretboard";

export { normalizeFretboardThemeName } from "@/data/fretboard/themes";

type FretboardDefaultConfig = Required<
  Omit<FretboardConfig, "instrument" | "tuningKey" | "tuning">
>;

type ResolvedFretboardSetup = Pick<
  ResolvedFretboardConfig,
  "instrument" | "tuning" | "tuningKey"
>;

const DEFAULT_FRETBOARD_INSTRUMENT: StringInstrumentKey = "guitar";
const DEFAULT_MARKER_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24] as const;

const FRETBOARD_DEFAULTS: FretboardDefaultConfig = {
  fretRange: [0, 12],
  leftHanded: false,

  background: "transparent",
  markerFrets: DEFAULT_MARKER_FRETS,

  showFretInlays: true,
  fretInlayColor: "var(--color-text-muted)",
  fretInlayWidth: "65cqi",
  fretInlayHeight: "80cqh",
  fretInlayImage: "trapezoid",
  fretInlayImages: {},
  fretInlayDoubles: [],
  fretInlayDoubleGap: "25cqh",

  showFretLabels: true,
  fretLabelsPosition: "bottom",
  fretLabelsBackground: "transparent",
  fretLabelsHeight: "7cqh",
  fretLabelColor: "var(--color-text)",
  fretLabelMode: "number",
  fretLabelImage: "circle",
  fretLabelImages: {},
  fretLabelDoubles: [12, 24],
  fretLabelDoubleGap: "clamp(1px, 0.4cqh, 3px)",

  showNut: true,
  nutColor: "var(--color-text)",
  nutWidth: "clamp(5px, 4.5cqh, 10px)",
  nutShadow: "1px 0 1px rgb(255 255 255 / 0.16), 0 1px 2px rgb(0 0 0 / 0.28)",

  evenFrets: false,
  showFretWires: true,
  fretWireColor: "var(--color-text-muted)",
  fretWireWidth: "clamp(1.5px, 2cqh, 4px)",
  fretWireShadow:
    "1px 0 1px rgb(255 255 255 / 0.12), 0 1px 1px rgb(0 0 0 / 0.22)",

  showStrings: true,
  stringColor: "var(--color-text)",
  stringColors: [],
  stringShadow: "0 1px 0 rgb(255 255 255 / 0.08), 0 1px 2px rgb(0 0 0 / 0.34)",
  stringTexture: "plain",
  stringTextures: [],
  stringWidth: "max(1.5px, 1cqh)",
  stringWidths: [],
};

const BOOLEAN_KEYS = [
  "leftHanded",
  "showFretInlays",
  "showFretLabels",
  "showNut",
  "evenFrets",
  "showFretWires",
  "showStrings",
] satisfies readonly (keyof FretboardConfig)[];

const STRING_KEYS = [
  "background",
  "fretInlayColor",
  "fretInlayWidth",
  "fretInlayHeight",
  "fretInlayDoubleGap",
  "fretLabelsBackground",
  "fretLabelsHeight",
  "fretLabelColor",
  "fretLabelDoubleGap",
  "nutColor",
  "nutWidth",
  "nutShadow",
  "fretWireColor",
  "fretWireWidth",
  "fretWireShadow",
  "stringColor",
  "stringShadow",
  "stringWidth",
] satisfies readonly (keyof FretboardConfig)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringInstrumentKey(value: unknown): value is StringInstrumentKey {
  return typeof value === "string" && value in stringInstruments;
}

function isStringInstrumentTuningKey(
  value: unknown,
): value is StringInstrumentTuningKey {
  return typeof value === "string" && value in stringInstrumentTunings;
}

function isValidFretboardIcon(icon: unknown): icon is FretboardIcon {
  return (
    typeof icon === "string" &&
    fretboardIconNames.includes(icon as FretboardIcon)
  );
}

function getTuningInstrument(
  tuningKey: StringInstrumentTuningKey,
): StringInstrumentKey {
  return stringInstrumentTunings[tuningKey].instrument as StringInstrumentKey;
}

function getDefaultTuningKey(
  instrument: StringInstrumentKey,
): StringInstrumentTuningKey {
  return stringInstruments[instrument].defaultTuning;
}

function getTuningFromKey(tuningKey: StringInstrumentTuningKey) {
  return [...stringInstrumentTunings[tuningKey].openMidiNotes].reverse();
}

function normalizeCustomTuning(
  tuning: FretboardConfig["tuning"],
): readonly number[] | undefined {
  if (!Array.isArray(tuning)) {
    return undefined;
  }

  const validTuning = tuning.filter((midi) => Number.isFinite(midi));
  return validTuning.length > 0 ? validTuning : undefined;
}

function resolveFretboardSetup(
  config?: FretboardConfig,
): ResolvedFretboardSetup {
  const rawInstrument = config?.instrument;
  const rawTuningKey = config?.tuningKey;
  const explicitInstrument = isStringInstrumentKey(rawInstrument)
    ? rawInstrument
    : undefined;
  const explicitTuningKey = isStringInstrumentTuningKey(rawTuningKey)
    ? rawTuningKey
    : undefined;
  const tuningKeyInstrument = explicitTuningKey
    ? getTuningInstrument(explicitTuningKey)
    : undefined;
  const instrument =
    explicitInstrument ?? tuningKeyInstrument ?? DEFAULT_FRETBOARD_INSTRUMENT;
  const matchedTuningKey =
    explicitTuningKey && tuningKeyInstrument === instrument
      ? explicitTuningKey
      : undefined;
  const customTuning = normalizeCustomTuning(config?.tuning);
  const tuningKey =
    matchedTuningKey ??
    (customTuning ? undefined : getDefaultTuningKey(instrument));

  return {
    instrument,
    ...(tuningKey ? { tuningKey } : {}),
    tuning: tuningKey
      ? getTuningFromKey(tuningKey)
      : (customTuning ?? getTuningFromKey(getDefaultTuningKey(instrument))),
  };
}

function normalizeFretRange(
  fretRange: FretboardConfig["fretRange"],
): [number, number] {
  if (!Array.isArray(fretRange)) {
    return FRETBOARD_DEFAULTS.fretRange;
  }

  let [startFret, endFret] = fretRange;
  if (!Number.isFinite(startFret) || !Number.isFinite(endFret)) {
    return FRETBOARD_DEFAULTS.fretRange;
  }

  startFret = Math.max(0, Math.floor(startFret));
  endFret = Math.max(0, Math.floor(endFret));

  return startFret <= endFret ? [startFret, endFret] : [endFret, startFret];
}

function normalizeIconRecord(
  icons:
    | FretboardConfig["fretInlayImages"]
    | FretboardConfig["fretLabelImages"],
) {
  if (!isRecord(icons)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(icons).filter(([, icon]) => isValidFretboardIcon(icon)),
  ) as Record<number, FretboardIcon>;
}

function getDefaultStringWidth(stringIndex: number, stringCount: number) {
  if (stringCount <= 1) {
    return "max(1.5px, 1.2cqh)";
  }

  // cqh resolves against the fretboard root for strings, so keep the visual
  // thickness tied to a string row instead of the whole multi-string board.
  const rowRelativeThickness = 5.4 + (stringIndex / (stringCount - 1)) * 5.1;
  const thickness = rowRelativeThickness / stringCount;
  return `max(1.5px, ${thickness.toFixed(2)}cqh)`;
}

function getDefaultStringTexture(
  openStringMidi: number,
): FretboardStringTexture {
  // wound applies to E3 and lower.
  return openStringMidi <= 52 ? "wound" : "plain";
}

function normalizeStringStyleArray(
  values: FretboardConfig["stringColors"] | FretboardConfig["stringWidths"],
  tuningLength: number,
  getFallback?: (index: number) => string | undefined,
) {
  return Array.from({ length: tuningLength }, (_, index) => {
    const value = Array.isArray(values) ? values[index] : undefined;
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : getFallback?.(index);
  });
}

function isValidStringTexture(
  texture: unknown,
): texture is FretboardStringTexture {
  return texture === "plain" || texture === "wound";
}

function normalizeStringTextureArray(
  values: FretboardConfig["stringTextures"],
  tuning: readonly number[],
) {
  return Array.from({ length: tuning.length }, (_, index) => {
    const value = Array.isArray(values) ? values[index] : undefined;
    return isValidStringTexture(value)
      ? value
      : getDefaultStringTexture(tuning[index]);
  });
}

function normalizeNumberArray(values: unknown): readonly number[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const normalizedValues = values
    .filter((value): value is number => Number.isFinite(value))
    .map((value) => Math.max(0, Math.floor(value)));

  return normalizedValues;
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function areArraysEqual(
  a: readonly unknown[] | undefined,
  b: readonly unknown[] | undefined,
) {
  if (!a || !b) {
    return a === b;
  }

  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function areRecordsEqual(
  a: Record<number, unknown>,
  b: Record<number, unknown>,
) {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  return (
    keysA.length === keysB.length &&
    keysA.every((key) => a[Number(key)] === b[Number(key)])
  );
}

function getSetupOverrides(setup: ResolvedFretboardSetup): FretboardConfig {
  const defaultTuningKey = getDefaultTuningKey(setup.instrument);
  const defaultTuning = getTuningFromKey(defaultTuningKey);
  const setupOverrides: FretboardConfig = {};

  if (setup.instrument !== DEFAULT_FRETBOARD_INSTRUMENT) {
    setupOverrides.instrument = setup.instrument;
  }

  if (setup.tuningKey && setup.tuningKey !== defaultTuningKey) {
    setupOverrides.tuningKey = setup.tuningKey;
  }

  if (!setup.tuningKey && !areArraysEqual(setup.tuning, defaultTuning)) {
    setupOverrides.tuning = setup.tuning;
  }

  return setupOverrides;
}

/**
 * Returns compact fretboard overrides suitable for persisted workspace state.
 * Defaults and theme values are omitted so saved settings remain resilient to
 * future theme improvements.
 */
export function normalizeFretboardConfig(
  overrides: unknown,
  theme?: FretboardThemeName,
): FretboardConfig | undefined {
  if (!isRecord(overrides)) {
    return undefined;
  }

  const setup = resolveFretboardSetup(overrides as FretboardConfig);
  const baseConfig = createFretboardConfig(theme, {
    instrument: setup.instrument,
    ...(setup.tuningKey ? { tuningKey: setup.tuningKey } : {}),
    ...(!setup.tuningKey ? { tuning: setup.tuning } : {}),
  });
  const normalized: FretboardConfig = getSetupOverrides(setup);
  const tuningLength = setup.tuning.length;

  const fretRange = normalizeFretRange(
    overrides.fretRange as FretboardConfig["fretRange"],
  );
  if (!areArraysEqual(fretRange, baseConfig.fretRange)) {
    normalized.fretRange = fretRange;
  }

  BOOLEAN_KEYS.forEach((key) => {
    const value = overrides[key];
    if (typeof value === "boolean" && value !== baseConfig[key]) {
      normalized[key] = value;
    }
  });

  STRING_KEYS.forEach((key) => {
    const value = normalizeString(overrides[key]);
    if (value !== undefined && value !== baseConfig[key]) {
      normalized[key] = value;
    }
  });

  const markerFrets = normalizeNumberArray(overrides.markerFrets);
  if (markerFrets && !areArraysEqual(markerFrets, baseConfig.markerFrets)) {
    normalized.markerFrets = markerFrets;
  }

  const fretInlayDoubles = normalizeNumberArray(overrides.fretInlayDoubles);
  if (
    fretInlayDoubles &&
    !areArraysEqual(fretInlayDoubles, baseConfig.fretInlayDoubles)
  ) {
    normalized.fretInlayDoubles = fretInlayDoubles;
  }

  const fretLabelDoubles = normalizeNumberArray(overrides.fretLabelDoubles);
  if (
    fretLabelDoubles &&
    !areArraysEqual(fretLabelDoubles, baseConfig.fretLabelDoubles)
  ) {
    normalized.fretLabelDoubles = fretLabelDoubles;
  }

  if (
    (overrides.fretLabelsPosition === "top" ||
      overrides.fretLabelsPosition === "bottom") &&
    overrides.fretLabelsPosition !== baseConfig.fretLabelsPosition
  ) {
    normalized.fretLabelsPosition = overrides.fretLabelsPosition;
  }

  if (
    (overrides.fretLabelMode === "number" ||
      overrides.fretLabelMode === "image") &&
    overrides.fretLabelMode !== baseConfig.fretLabelMode
  ) {
    normalized.fretLabelMode = overrides.fretLabelMode;
  }

  const fretInlayImage = overrides.fretInlayImage;
  if (
    isValidFretboardIcon(fretInlayImage) &&
    fretInlayImage !== baseConfig.fretInlayImage
  ) {
    normalized.fretInlayImage = fretInlayImage;
  }

  const fretLabelImage = overrides.fretLabelImage;
  if (
    isValidFretboardIcon(fretLabelImage) &&
    fretLabelImage !== baseConfig.fretLabelImage
  ) {
    normalized.fretLabelImage = fretLabelImage;
  }

  const fretInlayImages = normalizeIconRecord(
    overrides.fretInlayImages as FretboardConfig["fretInlayImages"],
  );
  if (!areRecordsEqual(fretInlayImages, baseConfig.fretInlayImages)) {
    normalized.fretInlayImages = fretInlayImages;
  }

  const fretLabelImages = normalizeIconRecord(
    overrides.fretLabelImages as FretboardConfig["fretLabelImages"],
  );
  if (!areRecordsEqual(fretLabelImages, baseConfig.fretLabelImages)) {
    normalized.fretLabelImages = fretLabelImages;
  }

  const stringColors = normalizeStringStyleArray(
    overrides.stringColors as FretboardConfig["stringColors"],
    tuningLength,
  );
  if (!areArraysEqual(stringColors, baseConfig.stringColors)) {
    normalized.stringColors = stringColors;
  }

  const stringTexture = overrides.stringTexture;
  if (
    isValidStringTexture(stringTexture) &&
    stringTexture !== baseConfig.stringTexture
  ) {
    normalized.stringTexture = stringTexture;
  }

  const stringTextures = normalizeStringTextureArray(
    overrides.stringTextures as FretboardConfig["stringTextures"],
    setup.tuning,
  );
  if (!areArraysEqual(stringTextures, baseConfig.stringTextures)) {
    normalized.stringTextures = stringTextures;
  }

  const stringWidths = normalizeStringStyleArray(
    overrides.stringWidths as FretboardConfig["stringWidths"],
    tuningLength,
    (index) => getDefaultStringWidth(index, tuningLength),
  );
  if (!areArraysEqual(stringWidths, baseConfig.stringWidths)) {
    normalized.stringWidths = stringWidths;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Creates a fully resolved FretboardConfig from an optional theme and user overrides.
 * Theme name is resolved to an actual stored object, falling back to the default theme.
 */
export function createFretboardConfig(
  theme?: FretboardThemeName,
  overrides?: FretboardConfig,
): ResolvedFretboardConfig {
  const normalizedThemeName = normalizeFretboardThemeName(theme);
  const themeName = normalizedThemeName ?? DEFAULT_FRETBOARD_THEME;
  const themeConfig: FretboardConfig = fretboardThemes[themeName].config;

  if (process.env.NODE_ENV === "development" && theme && !normalizedThemeName) {
    console.warn(
      `[createFretboardConfig] Theme "${theme}" not found. Falling back to "${DEFAULT_FRETBOARD_THEME}".`,
    );
  }

  const setup = resolveFretboardSetup(overrides);
  const mergedConfig: FretboardConfig = {
    ...FRETBOARD_DEFAULTS,
    ...themeConfig,
    ...overrides,
  };
  const customStringWidth =
    normalizeString(overrides?.stringWidth) ??
    normalizeString(themeConfig.stringWidth);
  const styleConfig: FretboardConfig = { ...mergedConfig };
  delete styleConfig.instrument;
  delete styleConfig.tuningKey;
  delete styleConfig.tuning;

  return {
    ...FRETBOARD_DEFAULTS,
    ...styleConfig,
    instrument: setup.instrument,
    ...(setup.tuningKey ? { tuningKey: setup.tuningKey } : {}),
    tuning: setup.tuning,
    fretRange: normalizeFretRange(mergedConfig.fretRange),
    fretInlayImage: isValidFretboardIcon(mergedConfig.fretInlayImage)
      ? mergedConfig.fretInlayImage
      : FRETBOARD_DEFAULTS.fretInlayImage,
    fretLabelImage: isValidFretboardIcon(mergedConfig.fretLabelImage)
      ? mergedConfig.fretLabelImage
      : FRETBOARD_DEFAULTS.fretLabelImage,
    fretInlayImages: normalizeIconRecord(mergedConfig.fretInlayImages),
    fretLabelImages: normalizeIconRecord(mergedConfig.fretLabelImages),
    stringColors: normalizeStringStyleArray(
      mergedConfig.stringColors,
      setup.tuning.length,
    ),
    stringTexture: isValidStringTexture(mergedConfig.stringTexture)
      ? mergedConfig.stringTexture
      : FRETBOARD_DEFAULTS.stringTexture,
    stringTextures: normalizeStringTextureArray(
      mergedConfig.stringTextures,
      setup.tuning,
    ),
    stringWidths: normalizeStringStyleArray(
      mergedConfig.stringWidths,
      setup.tuning.length,
      (index) =>
        customStringWidth ?? getDefaultStringWidth(index, setup.tuning.length),
    ),
  };
}
