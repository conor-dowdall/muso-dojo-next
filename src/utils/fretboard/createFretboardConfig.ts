import { isProportionalFretboardIcon } from "@/data/fretboard/icons";
import {
  getDefaultFretboardVisualProfile,
  getDefaultFretboardWoodThemeName,
  getDefaultMarkerFrets,
  getDefaultShowFretInlays,
} from "@/data/fretboard/instrumentDefaults";
import {
  DEFAULT_FRETBOARD_INLAY_PRESET,
  fretboardInlayPresets,
  normalizeFretboardInlayPresetName,
  type FretboardInlayPresetName,
} from "@/data/fretboard/inlayPresets";
import {
  fretboardThemes,
  normalizeFretboardThemeName,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import {
  type FretboardConfig,
  type ResolvedFretboardConfig,
} from "@/types/fretboard";
import {
  FRETBOARD_DEFAULTS,
  getDefaultProportionalInlaySize,
  getDefaultStringWidth,
  hasCustomProportionalInlaySize,
  isValidFretboardIcon,
  isValidStringTexture,
  normalizeFretboardStyleString,
  normalizeFretRange,
  normalizeIconRecord,
  normalizeStringStyleArray,
  normalizeStringTextureArray,
  resolveFretboardSetup,
} from "./fretboardConfigPrimitives";

export { normalizeFretboardThemeName } from "@/data/fretboard/themes";

/**
 * Creates a fully resolved FretboardConfig from an optional theme and user overrides.
 * Theme name is resolved to an actual stored object, falling back to the default theme.
 */
export function createFretboardConfig(
  theme?: FretboardThemeName,
  overrides?: FretboardConfig,
  inlayPreset: FretboardInlayPresetName = DEFAULT_FRETBOARD_INLAY_PRESET,
): ResolvedFretboardConfig {
  const setup = resolveFretboardSetup(overrides);
  const normalizedThemeName = normalizeFretboardThemeName(theme);
  const defaultThemeName = getDefaultFretboardWoodThemeName(setup.instrument);
  const themeName = normalizedThemeName ?? defaultThemeName;
  const themeConfig: FretboardConfig = fretboardThemes[themeName].config;
  const normalizedInlayPreset =
    normalizeFretboardInlayPresetName(inlayPreset) ??
    DEFAULT_FRETBOARD_INLAY_PRESET;
  const inlayPresetConfig = fretboardInlayPresets[normalizedInlayPreset].config;
  const visualProfile = getDefaultFretboardVisualProfile(setup.instrument);

  if (process.env.NODE_ENV === "development" && theme && !normalizedThemeName) {
    console.warn(
      `[createFretboardConfig] Theme "${theme}" not found. Falling back to "${defaultThemeName}".`,
    );
  }

  const instrumentDefaults: FretboardConfig = {
    fretLabelsHeight: `${visualProfile.fretLabelHeight}px`,
    markerFrets: getDefaultMarkerFrets(setup.instrument),
    showFretInlays: getDefaultShowFretInlays(setup.instrument),
  };
  const mergedConfig: FretboardConfig = {
    ...FRETBOARD_DEFAULTS,
    ...instrumentDefaults,
    ...themeConfig,
    ...overrides,
    ...inlayPresetConfig,
  };
  const customStringWidth =
    normalizeFretboardStyleString(overrides?.stringWidth) ??
    normalizeFretboardStyleString(themeConfig.stringWidth);
  const fretInlayImage = isValidFretboardIcon(mergedConfig.fretInlayImage)
    ? mergedConfig.fretInlayImage
    : FRETBOARD_DEFAULTS.fretInlayImage;
  const styleConfig: FretboardConfig = { ...mergedConfig };
  delete styleConfig.instrument;
  delete styleConfig.tuningKey;
  delete styleConfig.tuning;
  delete styleConfig.tuningName;

  if (
    isProportionalFretboardIcon(fretInlayImage) &&
    !hasCustomProportionalInlaySize(overrides?.fretInlayWidth)
  ) {
    styleConfig.fretInlayWidth = getDefaultProportionalInlaySize(visualProfile);
  }

  if (
    isProportionalFretboardIcon(fretInlayImage) &&
    !hasCustomProportionalInlaySize(overrides?.fretInlayHeight)
  ) {
    styleConfig.fretInlayHeight =
      getDefaultProportionalInlaySize(visualProfile);
  }

  return {
    ...FRETBOARD_DEFAULTS,
    ...instrumentDefaults,
    ...styleConfig,
    instrument: setup.instrument,
    ...(setup.tuningKey ? { tuningKey: setup.tuningKey } : {}),
    ...(setup.tuningName ? { tuningName: setup.tuningName } : {}),
    tuning: setup.tuning,
    fretRange: normalizeFretRange(mergedConfig.fretRange),
    fretInlayImage,
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
        customStringWidth ??
        getDefaultStringWidth(index, setup.tuning.length, setup.instrument),
    ),
  };
}
