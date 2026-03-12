import { type FretboardConfig } from "@/types/fretboard/fretboard";
import { guitarTunings } from "@/configs/fretboard/tunings/guitar";
import { fretMarkers } from "@/configs/fretboard/fretMarkers";

export const guitarBase: FretboardConfig = {
  tuning: guitarTunings["Standard E"],
  markerFrets: fretMarkers["Guitar Style"],
  showNut: true,
  fretInlayDoubles: [12, 24],
  fretLabelDoubles: [12, 24],
  showStrings: true,
  showFretInlays: true,
  showFretLabels: true,
  showFretWires: true,
  stringColor: "repeating-linear-gradient(to right, #cac3c3ff, #726c6cff 1px)",
  stringColors: {
    1: "#b09e9eff",
    2: "#b09e9eff",
    3: "#b09e9eff",
  },
  stringWidth: "max(1px, 0.9cqh)",
  stringWidths: {
    1: "max(1px, 0.7cqh)",
    2: "max(1px, 0.8cqh)",
    3: "max(1px, 0.9cqh)",
    4: "max(1px, 1.2cqh)",
    5: "max(1px, 1.6cqh)",
    6: "max(1px, 2.1cqh)",
  },
};
