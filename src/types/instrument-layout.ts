/**
 * User-facing size presets. These are safe to store in Zustand because they
 * describe intent, not derived dimensions.
 */
export type InstrumentSize = "compact" | "comfortable" | "large";

export type InstrumentWidthMode = "auto" | "fill" | "scroll";

/**
 * Storable layout intent for an instrument.
 *
 * Keep this shape serializable and small. Derived values such as intrinsic
 * geometry, CSS variables, and calculated pixel dimensions belong in runtime
 * resolvers, not persisted Zustand state.
 */
export interface InstrumentLayoutConfig {
  size?: InstrumentSize;
  /**
   * Multiplies the instrument's intrinsic geometry-derived dimensions.
   * Use size for the normal UI control; use scale for advanced composition.
   */
  scale?: number;
  /**
   * auto: use the instrument's natural geometry-derived width.
   * fill: stretch to the parent width.
   * scroll: preserve readable width and scroll horizontally when needed.
   */
  widthMode?: InstrumentWidthMode;
  /** Advanced escape hatches for fixed lesson layouts and demos. */
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
}

/**
 * Runtime layout config after defaults and validation have been applied.
 * This is derived from InstrumentLayoutConfig and should not be persisted.
 */
export interface ResolvedInstrumentLayoutConfig extends Omit<
  InstrumentLayoutConfig,
  "size" | "scale" | "widthMode"
> {
  size: InstrumentSize;
  scale: number;
  widthMode: InstrumentWidthMode;
}

/**
 * Intrinsic instrument dimensions derived from musical geometry.
 * These values depend on fret/key/string counts and should not be stored.
 */
export interface InstrumentIntrinsicSizing {
  preferredWidth: number;
  preferredHeight: number;
  minReadableWidth: number;
  minHeight: number;
  maxHeight: number;
}
