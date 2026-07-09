import { type FretboardInlayPresetName } from "@/data/fretboard/inlayPresets";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import { type FretboardConfig } from "@/types/fretboard";
import { createFretboardConfig } from "./createFretboardConfig";
import {
  DEFAULT_FRETBOARD_INSTRUMENT,
  getDefaultStringWidth,
  getDefaultTuningKey,
  getTuningFromKey,
  isFretboardConfigRecord,
  isValidFretboardIcon,
  isValidStringTexture,
  normalizeFretboardStyleString,
  normalizeFretRange,
  normalizeIconRecord,
  normalizeStringStyleArray,
  normalizeStringTextureArray,
  resolveFretboardSetup,
  type ResolvedFretboardSetup,
} from "./fretboardConfigPrimitives";

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

function normalizeNumberArray(values: unknown): readonly number[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  return values
    .filter((value): value is number => Number.isFinite(value))
    .map((value) => Math.max(0, Math.floor(value)));
}

function areArraysEqual(
  left: readonly unknown[] | undefined,
  right: readonly unknown[] | undefined,
) {
  if (!left || !right) {
    return left === right;
  }

  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function areRecordsEqual(
  left: Record<number, unknown>,
  right: Record<number, unknown>,
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => left[Number(key)] === right[Number(key)])
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

  if (
    !setup.tuningKey &&
    (setup.tuningName || !areArraysEqual(setup.tuning, defaultTuning))
  ) {
    setupOverrides.tuning = setup.tuning;
  }

  if (!setup.tuningKey && setup.tuningName) {
    setupOverrides.tuningName = setup.tuningName;
  }

  return setupOverrides;
}

/**
 * Returns compact fretboard overrides suitable for persisted session state.
 * Defaults and theme values are omitted so saved settings remain resilient to
 * future theme improvements.
 */
export function normalizeFretboardConfig(
  overrides: unknown,
  theme?: FretboardThemeName,
  inlayPreset?: FretboardInlayPresetName,
): FretboardConfig | undefined {
  if (!isFretboardConfigRecord(overrides)) {
    return undefined;
  }

  const setup = resolveFretboardSetup(overrides as FretboardConfig);
  const baseConfig = createFretboardConfig(
    theme,
    {
      instrument: setup.instrument,
      ...(setup.tuningKey ? { tuningKey: setup.tuningKey } : {}),
      ...(!setup.tuningKey ? { tuning: setup.tuning } : {}),
      ...(setup.tuningName ? { tuningName: setup.tuningName } : {}),
    },
    inlayPreset,
  );
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
    const value = normalizeFretboardStyleString(overrides[key]);
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
    (index) => getDefaultStringWidth(index, tuningLength, setup.instrument),
  );
  if (!areArraysEqual(stringWidths, baseConfig.stringWidths)) {
    normalized.stringWidths = stringWidths;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}
