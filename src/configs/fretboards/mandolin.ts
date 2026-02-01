import type { FretboardConfig } from "@/types/fretboard";

const mandolin: FretboardConfig = {
  tuning: [55, 62, 69, 76], // G3, D4, A4, E5
  fretRange: [0, 12],
  rootNote: "C",
  noteCollectionKey: "ionian",
  darkMode: false,
  showFretLines: true,
  showFretLabels: true,
  fretLabelMarkers: [3, 5, 7, 9, 12],
  showInlays: true,
  fretLabelAreaHeight: "1.5rem",
  interactive: true,
};

export default mandolin;
