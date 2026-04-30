import {
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { type FretboardIcon } from "@/data/fretboard/icons";
import { type FretboardThemeName } from "@/data/fretboard/themes";
import {
  type InstrumentComponentProps,
  type InstrumentPresentation,
} from "@/types/instrument";
import { type InstrumentIntrinsicSizing } from "@/types/instrument-layout";
import { type InstrumentNoteCellInfo } from "@/types/instrument-note-cell";

export type FretboardStringTexture = "plain" | "wound";

/**
 * Storable fretboard overrides.
 *
 * Themes, defaults, geometry, and intrinsic sizing are resolved at render time
 * so Zustand does not need to persist derived fretboard state.
 */
export interface FretboardConfig {
  // Setup
  instrument?: StringInstrumentKey;
  tuningKey?: StringInstrumentTuningKey;
  tuning?: readonly number[];
  fretRange?: [number, number];
  leftHanded?: boolean;

  // Fretboard Design
  background?: string;
  markerFrets?: readonly number[]; // used for fret inlay-and-label positions

  // Fret Markers
  showFretInlays?: boolean;
  fretInlayColor?: string;
  fretInlayWidth?: string;
  fretInlayHeight?: string;
  fretInlayImage?: FretboardIcon;
  fretInlayImages?: Record<number, FretboardIcon>;
  fretInlayDoubles?: readonly number[];
  fretInlayDoubleGap?: string;

  // Fret Labels
  showFretLabels?: boolean;
  fretLabelsPosition?: "top" | "bottom";
  fretLabelsBackground?: string;
  fretLabelsHeight?: string;
  fretLabelColor?: string;
  fretLabelMode?: "number" | "image";
  fretLabelImage?: FretboardIcon;
  fretLabelImages?: Record<number, FretboardIcon>;
  fretLabelDoubles?: readonly number[];
  fretLabelDoubleGap?: string;

  // Nut
  showNut?: boolean;
  nutColor?: string;
  nutWidth?: string;
  nutShadow?: string;

  // Frets
  evenFrets?: boolean;
  showFretWires?: boolean;
  fretWireColor?: string;
  fretWireWidth?: string;
  fretWireShadow?: string;

  // Strings
  showStrings?: boolean;
  stringColor?: string;
  stringColors?: readonly (string | undefined)[];
  stringShadow?: string;
  stringTexture?: FretboardStringTexture;
  stringTextures?: readonly (FretboardStringTexture | undefined)[];
  stringWidth?: string;
  stringWidths?: readonly (string | undefined)[];
}

/** Runtime-only config after defaults, theme, and overrides are resolved. */
export interface ResolvedFretboardConfig extends Required<
  Omit<FretboardConfig, "instrument" | "tuningKey">
> {
  instrument: StringInstrumentKey;
  tuningKey?: StringInstrumentTuningKey;
}

export interface FretboardNoteCellInfo extends InstrumentNoteCellInfo {
  stringIndex: number;
  fretNumber: number;
  fretIndex: number;
}

export interface FretboardGeometry extends ResolvedFretboardConfig {
  numFrets: number;
  fretboardGridColumns: string;
  isFretLabelsBottom: boolean;
  mainContentGridRow: string;
  fretLabelsGridRow: string;
  fretNumbers: number[];
  stringIndices: number[];
  noteCells: FretboardNoteCellInfo[];
  sizing: InstrumentIntrinsicSizing;
  isMarker: (fret: number) => boolean;
  isDoubleInlay: (fret: number) => boolean;
  isDoubleLabel: (fret: number) => boolean;
}

export type FretboardPresentation = InstrumentPresentation;

export interface FretboardProps extends InstrumentComponentProps {
  theme?: FretboardThemeName;
  config?: FretboardConfig;
}
