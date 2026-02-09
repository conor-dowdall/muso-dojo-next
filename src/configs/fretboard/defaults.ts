import { FretboardConfig } from "@/types/fretboard";

export const fretboardDefaults: Required<FretboardConfig> = {
  tuning: [64, 59, 55, 50, 45, 40],
  fretRange: [0, 12],
  leftHanded: false,

  background: "transparent",
  markerFrets: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],

  showFretInlays: true,
  fretInlayColor: "#888888",
  fretInlayWidth: "1.5cqi",
  fretInlayHeight: "1.5cqi",
  fretInlayImage: "circle",
  fretInlayImages: {},
  fretInlayDoubles: [12, 24],
  fretInlayDoubleGap: "20%",

  showFretLabels: true,
  fretLabelsPosition: "bottom",
  fretLabelsBackground: "transparent",
  fretLabelsColor: "black",
  fretLabelsHeight: "1.5cqi",
  fretLabelMode: "number",
  fretLabelImage: "circle",
  fretLabelImages: {},
  fretLabelDoubles: [12, 24],
  fretLabelDoubleGap: "0.2cqi",

  showNut: true,
  nutColor: "#444444",
  nutWidth: "0.8cqi",

  evenFrets: false,
  showFretWires: true,
  fretWireColor: "#aaaaaa",
  fretWireWidth: "0.4cqi",

  showStrings: true,
  stringColor: "#dddddd",
  stringColors: {},
  stringWidth: "0.2cqi",
  stringWidths: {},
};
