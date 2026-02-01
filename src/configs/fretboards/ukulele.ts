import type { FretboardConfig } from "@/types/fretboard";

const ukulele: FretboardConfig = {
  tuning: [67, 60, 64, 69], // G4, C4, E4, A4 (common re-entrant G)
  fretRange: [0, 15],
  rootNote: "C",
  noteCollectionKey: "ionian",
  darkMode: false,
  showFretLines: true,
  showFretLabels: true,
  fretLabelMarkers: [5, 7, 10, 12],
  showInlays: true,
  fretLabelAreaHeight: "1.5rem",
  interactive: true,
};

export default ukulele;
