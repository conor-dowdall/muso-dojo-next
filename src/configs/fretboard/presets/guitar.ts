import type { FretboardConfig } from "@/types/fretboard";

const guitar: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40], // standard guitar (E4, B3, G3, D3, A2, E2 MIDI-ish)
  fretRange: [0, 12],
  darkMode: true,
  showFretWires: true,
  showFretLabels: true,
  markerFrets: [3, 5, 7, 9, 12],
  showInlays: true,
  fretLabelAreaHeight: "2rem",
  interactive: true,
  theme: {
    stringWidths: ["1px", "1px", "2px", "2px", "3px", "3px"],
  },
};

export default guitar;
