import type { FretboardConfig } from "@/types/fretboard";

const violin: FretboardConfig = {
  tuning: [55, 62, 69, 76], // G3, D4, A4, E5
  fretRange: [0, 20],
  rootNote: "C",
  noteCollectionKey: "ionian",
  darkMode: false,
  showFretLines: true,
  showFretLabels: false,
  fretLabelMarkers: [12],
  showInlays: false,
  fretLabelAreaHeight: "1.5rem",
  interactive: true,
};

export default violin;
