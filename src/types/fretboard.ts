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

  // Fretboard Design
  background?: string;
  markerFrets?: number[]; // used for fret inlay-and-label positions

  // Fret Markers
  showFretInlays: boolean;
  fretInlayColor?: string;
  fretInlayWidth?: string;
  fretInlayHeight?: string;
  fretInlayImage?: "circle" | "star" | "triangle" | "square";
  fretInlayImages?: Record<number, "circle" | "star" | "triangle" | "square">;

  // Fret Labels
  showFretLabels: boolean;
  fretLabelsPosition?: "top" | "bottom";
  fretLabelsBackground?: string;
  fretLabelsColor?: string;
  fretLabelsHeight?: string;
  fretLabelMode?: "number" | "image";
  fretLabelImage?: "circle" | "star" | "triangle" | "square";
  fretLabelImages?: Record<number, "circle" | "star" | "triangle" | "square">;

  // Nut
  showNut: boolean;
  nutColor?: string;
  nutWidth?: string;

  // Frets
  evenFrets: boolean;
  showFretWires: boolean;
  fretWireColor?: string;
  fretWireWidth?: string;

  // Strings
  showStrings: boolean;
  stringColor?: string;
  stringWidth?: string;
  stringWidths?: Record<number, string>;
}

export type PartialFretboardConfig = Partial<FretboardConfig>;

export interface FretboardProps {
  config?: PartialFretboardConfig;
  preset?: FretboardPresetName;
}

export interface FretProps {
  fretNumber: number;
  config: FretboardConfig;
  rootNote?: RootNote;
  noteCollectionKey?: NoteCollectionKey;
}
