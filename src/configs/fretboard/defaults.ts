import { type FretboardConfig } from "@/types/fretboard/fretboard";
import { fretMarkers } from "./fretMarkers";
import { guitarTunings } from "./tunings";

export const fretboardDefaults: Required<FretboardConfig> = {
  tuning: guitarTunings["Standard E"],
  fretRange: [0, 12],
  leftHanded: false,

  background: "transparent",
  markerFrets: fretMarkers["Guitar Style"],

  showFretInlays: true,
  fretInlayColor: "light-dark(lightgray, #505050)",
  fretInlayWidth: "65%",
  fretInlayHeight: "80%",
  fretInlayImage: "trapezoid",
  fretInlayImages: {},
  fretInlayDoubles: [],
  fretInlayDoubleGap: "20%",

  showFretLabels: true,
  fretLabelsPosition: "bottom",
  fretLabelsBackground: "transparent",
  fretLabelsHeight: "6cqh",
  fretLabelColor: "light-dark(black, white)",
  fretLabelMode: "number",
  fretLabelImage: "circle",
  fretLabelImages: {},
  fretLabelDoubles: [12, 24],
  fretLabelDoubleGap: "max(1px, 0.2cqi)",

  showNut: true,
  nutColor: "light-dark(black, white)",
  nutWidth: "max(1px, 0.8cqi)",

  evenFrets: false,
  showFretWires: true,
  fretWireColor: "light-dark(black, white)",
  fretWireWidth: "max(1px, 0.4cqi)",

  showStrings: true,
  stringColor: "light-dark(black, white)",
  stringColors: {},
  stringWidth: "max(1px, 0.9cqh)",
  stringWidths: {},
};
