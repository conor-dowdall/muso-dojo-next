import { FretboardPresetName } from "@/configs/fretboard/presets";
import { FretboardThemeName } from "@/configs/fretboard/themes";
import type { NoteCollectionKey, RootNote } from "@musodojo/music-theory-data";

/**
 * Fully resolved configuration - single source of truth for the shape.
 * All required properties are resolved to concrete objects (no strings).
 */
export interface FretboardConfig {
  // Setup
  tuning: number[];
  fretRange: [number, number];

  // Notes
  rootNote?: RootNote;
  noteCollectionKey?: NoteCollectionKey;

  // Visual
  showFretWires: boolean;
  showInlays: boolean;
  showFretLabels: boolean;
  fretLabelAreaHeight: string;
  markerFrets: number[];
  evenFrets?: boolean;
  theme: FretboardTheme; // ← Guaranteed resolved, never a string
  background?: string; // CSS background (color, image, gradient, etc.)

  // Interactivity
  interactive: boolean;
}

/**
 * User-facing configuration derived from FretboardConfig.
 * All properties are optional, and theme can be a string reference.
 */
export type FretboardConfigInput = Omit<Partial<FretboardConfig>, "theme"> & {
  theme?: FretboardThemeName | Partial<FretboardTheme>;
};

export interface FretboardProps extends FretboardConfigInput {
  config?: FretboardConfigInput;
  preset?: FretboardPresetName;
}

export interface FretboardTheme {
  fretWireColor: string;
  fretWireWidth: string;
  stringColor: string;
  stringWidths?: string[]; // For individual string widths
  stringWidth?: string; // For a uniform string width
}

export interface FretProps {
  fretNumber: number;
  theme: FretboardTheme;
}
