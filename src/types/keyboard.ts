import { type KeyboardRangeName } from "@/data/keyboard/ranges";
import { type KeyboardThemeName } from "@/data/keyboard/themes";
import {
  type InstrumentComponentProps,
  type InstrumentPresentation,
} from "@/types/instrument";
import { type InstrumentIntrinsicSizing } from "@/types/instrument-layout";
import { type InstrumentNoteCellInfo } from "@/types/instrument-note-cell";

/**
 * Storable keyboard overrides.
 *
 * Ranges, themes, defaults, geometry, and intrinsic sizing are resolved at
 * render time so Zustand does not need to persist derived keyboard state.
 */
export interface KeyboardConfig {
  /** Core MIDI note range [startMidi, endMidi] inclusive. */
  midiRange?: readonly [number, number];
  /** Include adjacent black edge keys as fully interactive keys when they complete the visual keyboard edge. */
  extendEdgeBlackKeys?: boolean;

  /** Background color of white keys */
  whiteKeyColor?: string;
  /** Background color of black keys */
  blackKeyColor?: string;

  /** Text color on white keys */
  whiteKeyTextColor?: string;
  /** Text color on black keys */
  blackKeyTextColor?: string;

  /** Border color for white keys */
  whiteKeyBorderColor?: string;
  /** Border color for black keys */
  blackKeyBorderColor?: string;
  /** Border radius for keys */
  keyBorderRadius?: string;

  /** Shadow treatment for white keys */
  whiteKeyShadow?: string;
  /** Shadow treatment for black keys */
  blackKeyShadow?: string;

  /** Black key height as a percentage of total keyboard height */
  blackKeyHeightPercent?: number;
  /** Black key width as a fraction of white key width */
  blackKeyWidthRatio?: number;
}

/** Runtime-only config after defaults, theme, range, and overrides are resolved. */
export type ResolvedKeyboardConfig = Required<KeyboardConfig>;

export interface KeyboardNoteCellInfo extends InstrumentNoteCellInfo {
  isBlack: boolean;
  left: string;
  width: string;
  height: string;
}

export interface KeyboardGeometry extends ResolvedKeyboardConfig {
  interactiveMidiRange: [number, number];
  whiteKeys: KeyboardNoteCellInfo[];
  blackKeys: KeyboardNoteCellInfo[];
  noteCells: KeyboardNoteCellInfo[];
  whiteKeyWidth: string;
  blackKeyWidth: string;
  sizing: InstrumentIntrinsicSizing;
}

export type KeyboardPresentation = InstrumentPresentation;

export interface KeyboardProps extends InstrumentComponentProps {
  range?: KeyboardRangeName;
  theme?: KeyboardThemeName;
  config?: KeyboardConfig;
}
