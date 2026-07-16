import { type StringInstrumentKey } from "@musodojo/music-theory-data";
import { DEFAULT_FRETBOARD_THEME, type FretboardThemeName } from "./themes";

export interface FretboardInstrumentVisualProfile {
  stringGaugeScale: number;
  preferredStringRowHeight: number;
  fretLabelHeight: number;
  proportionalInlaySizeCqh: number;
  proportionalInlayMaxPx: number;
  maxHeight: number;
}

export const FOURTHS_STYLE_MARKER_FRETS = [
  3, 5, 7, 9, 12, 15, 17, 19, 21, 24,
] as const;

export const FIFTHS_STYLE_MARKER_FRETS = [
  3, 5, 7, 10, 12, 15, 17, 19, 22, 24,
] as const;

const FIFTHS_STYLE_MARKER_INSTRUMENTS = new Set<StringInstrumentKey>([
  "mandolin",
  "ukulele",
  "violin",
  "viola",
  "cello",
]);

const FRETLESS_STYLE_INLAY_INSTRUMENTS = new Set<StringInstrumentKey>([
  "violin",
  "viola",
  "cello",
  "doubleBass",
]);

const DEFAULT_FRETBOARD_VISUAL_PROFILE: FretboardInstrumentVisualProfile = {
  stringGaugeScale: 1,
  preferredStringRowHeight: 24,
  fretLabelHeight: 12,
  proportionalInlaySizeCqh: 10.5,
  proportionalInlayMaxPx: 16,
  maxHeight: 260,
};

/*
 * These values model the apparent width of the playable neck/fingerboard,
 * not the full instrument body or scale length. A 4-string bass is therefore
 * close to a 6-string guitar in board height, but reads heavier through wider
 * string lanes and thicker string gauges.
 *
 * preferredStringRowHeight is the visual identity of the instrument. The
 * touch-friendly minimum height is derived from string count at geometry time,
 * so naturally small instruments still remain pleasant to play.
 */
const FRETBOARD_VISUAL_PROFILES: Record<
  StringInstrumentKey,
  FretboardInstrumentVisualProfile
> = {
  guitar: DEFAULT_FRETBOARD_VISUAL_PROFILE,
  bassGuitar: {
    stringGaugeScale: 1.36,
    preferredStringRowHeight: 33,
    fretLabelHeight: 12,
    proportionalInlaySizeCqh: 12.5,
    proportionalInlayMaxPx: 18,
    maxHeight: 290,
  },
  mandolin: {
    stringGaugeScale: 0.72,
    preferredStringRowHeight: 22,
    fretLabelHeight: 12,
    proportionalInlaySizeCqh: 12,
    proportionalInlayMaxPx: 13,
    maxHeight: 220,
  },
  ukulele: {
    stringGaugeScale: 0.78,
    preferredStringRowHeight: 23,
    fretLabelHeight: 12,
    proportionalInlaySizeCqh: 11,
    proportionalInlayMaxPx: 13,
    maxHeight: 230,
  },
  violin: {
    stringGaugeScale: 0.64,
    preferredStringRowHeight: 20,
    fretLabelHeight: 11,
    proportionalInlaySizeCqh: 10.5,
    proportionalInlayMaxPx: 12,
    maxHeight: 220,
  },
  viola: {
    stringGaugeScale: 0.76,
    preferredStringRowHeight: 21,
    fretLabelHeight: 12,
    proportionalInlaySizeCqh: 11,
    proportionalInlayMaxPx: 13,
    maxHeight: 230,
  },
  cello: {
    stringGaugeScale: 1.18,
    preferredStringRowHeight: 28,
    fretLabelHeight: 12,
    proportionalInlaySizeCqh: 12,
    proportionalInlayMaxPx: 17,
    maxHeight: 270,
  },
  doubleBass: {
    stringGaugeScale: 1.52,
    preferredStringRowHeight: 34,
    fretLabelHeight: 12,
    proportionalInlaySizeCqh: 12.5,
    proportionalInlayMaxPx: 18,
    maxHeight: 300,
  },
};

export function getDefaultFretboardWoodThemeName(
  instrument?: StringInstrumentKey,
): FretboardThemeName {
  switch (instrument) {
    case "mandolin":
    case "violin":
    case "viola":
    case "cello":
    case "doubleBass":
      return "ebony";
    case "guitar":
    case "bassGuitar":
    case "ukulele":
    case undefined:
      return DEFAULT_FRETBOARD_THEME;
  }
}

export function getDefaultMarkerFrets(instrument: StringInstrumentKey) {
  return FIFTHS_STYLE_MARKER_INSTRUMENTS.has(instrument)
    ? FIFTHS_STYLE_MARKER_FRETS
    : FOURTHS_STYLE_MARKER_FRETS;
}

export function getDefaultShowFretInlays(instrument: StringInstrumentKey) {
  return !FRETLESS_STYLE_INLAY_INSTRUMENTS.has(instrument);
}

export function getDefaultFretboardVisualProfile(
  instrument: StringInstrumentKey,
): FretboardInstrumentVisualProfile {
  return FRETBOARD_VISUAL_PROFILES[instrument];
}
