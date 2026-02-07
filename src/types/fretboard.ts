import { FretboardPresetName } from "@/configs/fretboard/presets";
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

  // Frets
  showFretWires: boolean;
  fretWireColor: string;
  fretWireWidth: string;
  evenFrets: boolean;

  // Strings
  showStrings: boolean;
  stringColor: string;
  stringWidths: string | string[];

  // Fret Labels
  showFretLabels: boolean;
  fretLabelAreaHeight: string;
  markerFrets: number[];

  // Fretboard Design
  background: string; // CSS background (color, image, gradient, etc.)
  showInlays: boolean;
}

export type PartialFretboardConfig = Partial<FretboardConfig>;

export interface FretboardProps {
  config?: PartialFretboardConfig;
  preset?: FretboardPresetName;
}

export interface FretProps {
  fretNumber: number;
  config: FretboardConfig;
}
