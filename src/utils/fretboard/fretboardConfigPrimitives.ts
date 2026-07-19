import {
  isStringInstrumentKey,
  isStringInstrumentTuningKey,
  stringInstruments,
  stringInstrumentTunings,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { fretboardIconNames, type FretboardIcon } from "@/data/fretboard/icons";
import {
  FOURTHS_STYLE_MARKER_FRETS,
  type FretboardInstrumentVisualProfile,
  getDefaultFretboardVisualProfile,
} from "@/data/fretboard/instrumentDefaults";
import {
  type FretboardConfig,
  type FretboardStringTexture,
  type ResolvedFretboardConfig,
} from "@/types/fretboard";
import { normalizeCustomTuningName } from "@/utils/fretboard/customFretboardTunings";

type FretboardDefaultConfig = Required<
  Omit<FretboardConfig, "instrument" | "tuningKey" | "tuning" | "tuningName">
>;

export type ResolvedFretboardSetup = Pick<
  ResolvedFretboardConfig,
  "instrument" | "tuning" | "tuningKey" | "tuningName"
>;

export const DEFAULT_FRETBOARD_INSTRUMENT: StringInstrumentKey = "guitar";
export const FRETBOARD_MIN_FRET = 0;
export const FRETBOARD_MAX_FRET = 24;
const PROPORTIONAL_INLAY_MIN_SIZE_PX = 7;
const PROPORTIONAL_INLAY_MAX_WIDTH = "62cqi";

export const FRETBOARD_DEFAULTS: FretboardDefaultConfig = {
  fretRange: [0, 12],
  leftHanded: false,

  background: "transparent",
  markerFrets: FOURTHS_STYLE_MARKER_FRETS,

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
  fretLabelsHeight: "15px",
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

export function isFretboardConfigRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidFretboardIcon(icon: unknown): icon is FretboardIcon {
  return (
    typeof icon === "string" &&
    fretboardIconNames.includes(icon as FretboardIcon)
  );
}

function getTuningInstrument(
  tuningKey: StringInstrumentTuningKey,
): StringInstrumentKey {
  return stringInstrumentTunings[tuningKey].instrument;
}

export function getDefaultTuningKey(
  instrument: StringInstrumentKey,
): StringInstrumentTuningKey {
  return stringInstruments[instrument].defaultTuning;
}

export function getTuningFromKey(tuningKey: StringInstrumentTuningKey) {
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

export function resolveFretboardSetup(
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
    ...(!tuningKey && customTuning
      ? { tuningName: normalizeCustomTuningName(config?.tuningName) }
      : {}),
    tuning: tuningKey
      ? getTuningFromKey(tuningKey)
      : (customTuning ?? getTuningFromKey(getDefaultTuningKey(instrument))),
  };
}

export function normalizeFretRange(
  fretRange: FretboardConfig["fretRange"],
): [number, number] {
  if (!Array.isArray(fretRange)) {
    return FRETBOARD_DEFAULTS.fretRange;
  }

  let [startFret, endFret] = fretRange;
  if (!Number.isFinite(startFret) || !Number.isFinite(endFret)) {
    return FRETBOARD_DEFAULTS.fretRange;
  }

  startFret = Math.min(
    FRETBOARD_MAX_FRET,
    Math.max(FRETBOARD_MIN_FRET, Math.floor(startFret)),
  );
  endFret = Math.min(
    FRETBOARD_MAX_FRET,
    Math.max(FRETBOARD_MIN_FRET, Math.floor(endFret)),
  );

  return startFret <= endFret ? [startFret, endFret] : [endFret, startFret];
}

export function normalizeIconRecord(
  icons:
    FretboardConfig["fretInlayImages"] | FretboardConfig["fretLabelImages"],
) {
  if (!isFretboardConfigRecord(icons)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(icons).filter(([, icon]) => isValidFretboardIcon(icon)),
  ) as Record<number, FretboardIcon>;
}

export function getDefaultStringWidth(
  stringIndex: number,
  stringCount: number,
  instrument: StringInstrumentKey,
) {
  if (stringCount <= 1) {
    const singleStringThickness =
      1.2 * getDefaultFretboardVisualProfile(instrument).stringGaugeScale;
    return `max(1.5px, ${singleStringThickness.toFixed(2)}cqh)`;
  }

  // cqh resolves against the fretboard root, so scale against one string row.
  const rowRelativeThickness = 5.4 + (stringIndex / (stringCount - 1)) * 5.1;
  const thickness =
    (rowRelativeThickness / stringCount) *
    getDefaultFretboardVisualProfile(instrument).stringGaugeScale;
  return `max(1.5px, ${thickness.toFixed(2)}cqh)`;
}

function getDefaultStringTexture(
  openStringMidi: number,
): FretboardStringTexture {
  return openStringMidi <= 52 ? "wound" : "plain";
}

export function normalizeStringStyleArray(
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

export function isValidStringTexture(
  texture: unknown,
): texture is FretboardStringTexture {
  return texture === "plain" || texture === "wound";
}

export function normalizeStringTextureArray(
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

export function normalizeFretboardStyleString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function hasCustomProportionalInlaySize(value: unknown) {
  return normalizeFretboardStyleString(value) !== undefined;
}

export function getDefaultProportionalInlaySize(
  profile: FretboardInstrumentVisualProfile,
) {
  const preferredSize = [
    `clamp(${PROPORTIONAL_INLAY_MIN_SIZE_PX}px`,
    `${profile.proportionalInlaySizeCqh}cqh`,
    `${profile.proportionalInlayMaxPx}px)`,
  ].join(", ");
  return `min(${preferredSize}, ${PROPORTIONAL_INLAY_MAX_WIDTH})`;
}
