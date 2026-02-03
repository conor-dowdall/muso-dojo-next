import type { NoteCollectionKey, RootNote } from "@musodojo/music-theory-data";

export interface FretboardTheme {
  fretWireColor: string;
  fretWireWidth: string;
  stringColor: string;
  stringWidths?: string[]; // For individual string widths
  stringWidth?: string; // For a uniform string width
}

export interface FretboardConfig {
  // Setup
  tuning: number[];
  fretRange: [number, number];

  // Notes
  rootNote?: RootNote;
  noteCollectionKey?: NoteCollectionKey;

  // Visual
  darkMode: boolean;
  showFretWires: boolean;
  showFretLabels: boolean;
  markerFrets: number[];
  showInlays: boolean;
  fretLabelAreaHeight?: string;
  evenFrets?: boolean;
  theme?: string | Partial<FretboardTheme>;

  // Interactivity
  interactive: boolean;
}
