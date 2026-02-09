import { FretboardConfig } from "@/types/fretboard";

export const lightTelecaster: FretboardConfig = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 22],
  leftHanded: false,

  background: "linear-gradient(to top right, #c0750d, #8e5509)",
  markerFrets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],

  showFretInlays: true,
  fretInlayColor: "linear-gradient(to top right, #323232ff, #575757ff)",
  fretInlayWidth: "1.5cqi",
  fretInlayHeight: "1.5cqi",
  fretInlayImage: "circle",
  fretInlayImages: {},
  fretInlayDoubles: [12, 24],
  fretInlayDoubleGap: "20%",

  showFretLabels: true,
  fretLabelsPosition: "bottom",
  fretLabelsBackground: "linear-gradient(to top right, #cba857, #c09d52)",
  fretLabelsColor: "black",
  fretLabelsHeight: "1.5cqi",
  fretLabelMode: "image",
  fretLabelImage: "star",
  fretLabelImages: {},
  fretLabelDoubles: [12, 24],
  fretLabelDoubleGap: "0.2cqi",

  showNut: true,
  nutColor: "linear-gradient(to top right, #e4cda2, #ceb992)",
  nutWidth: "0.8cqi",

  evenFrets: false,
  showFretWires: true,
  fretWireColor: "linear-gradient(to top right, #e2d6b9, #b0a690)",
  fretWireWidth: "0.4cqi",

  showStrings: true,
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
} as const;
