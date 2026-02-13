import { type FretboardConfig } from "@/types/fretboard";
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
  stringColor:
    "repeating-linear-gradient(to right, #cac3c3ff, #726c6cff 0.1cqi)",
  stringColors: {
    1: "#b09e9eff",
    2: "#b09e9eff",
    3: "#b09e9eff",
  },
  stringWidth: "0.2cqi",
  stringWidths: {
    1: "0.11cqi",
    2: "0.13cqi",
    3: "0.15cqi",
    4: "0.18cqi",
    5: "0.23cqi",
    6: "0.28cqi",
  },
};
