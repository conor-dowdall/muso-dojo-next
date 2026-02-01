import type { NoteCollectionKey, RootNote } from "@musodojo/music-theory-data";

export interface FretboardConfig {
  tuning: number[];
  fretRange: [number, number];
  rootNote: RootNote;
  noteCollectionKey: NoteCollectionKey;

  // Visual
  darkMode: boolean;
  showFretLines: boolean;
  showFretLabels: boolean;
  fretLabelMarkers: number[];
  showInlays: boolean;
  fretLabelAreaHeight?: string;

  // Interactivity
  interactive: boolean;
}

export type FretboardPresetName = string;
