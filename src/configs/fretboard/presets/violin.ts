import type { FretboardConfig } from "@/types/fretboard";

const violin: FretboardConfig = {
  tuning: [55, 62, 69, 76], // G3, D4, A4, E5
  fretRange: [0, 20],
  darkMode: false,
  showFretWires: false,
  showFretLabels: false,
  markerFrets: [12],
  showInlays: false,
  fretLabelAreaHeight: "1.5rem",
  interactive: true,
};

export default violin;
