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
  background: string;

  // Fret Markers
  showInlays: boolean;
  markerFrets: number[]; // also used for fret labels

  // Fret Labels
  showFretLabels: boolean;
  fretLabelsPosition: "top" | "bottom";
  freLabelsBackground: string;
  fretLabelsColor: string;
  fretLabelsHeight: string;
  fretLabelMode: "number" | "image";
  fretLabelImage?: "circle" | "star" | "triangle" | "square";
  fretLabelImages?: Record<number, "circle" | "star" | "triangle" | "square">;

  // Nut
  showNut: boolean;
  nutColor: string;
  nutWidth: string;

  // Frets
  showFretWires: boolean;
  fretWireColor: string;
  fretWireWidth: string;
  evenFrets: boolean;

  // Strings
  showStrings: boolean;
  stringColor: string;
  stringWidths: string | string[];

  // Notes
  rootNote?: RootNote;
  noteCollectionKey?: NoteCollectionKey;
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
