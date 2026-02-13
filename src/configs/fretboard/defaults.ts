import { type FretboardConfig } from "@/types/fretboard";
import { fretMarkers } from "./fretMarkers";
import { guitarTunings } from "./tunings";

export const fretboardDefaults: Required<FretboardConfig> = {
  tuning: guitarTunings["Standard E"],
  fretRange: [0, 12],
  leftHanded: false,

  background: "transparent",
  markerFrets: fretMarkers["Guitar Style"],

  showFretInlays: false,
  fretInlayColor: "transparent",
  fretInlayWidth: "1.5cqi",
  fretInlayHeight: "1.5cqi",
  fretInlayImage: "circle",
  fretInlayImages: {},
  fretInlayDoubles: [12, 24],
  fretInlayDoubleGap: "20%",

  showFretLabels: true,
  fretLabelsPosition: "bottom",
  fretLabelsBackground: "transparent",
  fretLabelsColor: "light-dark(black, white)",
  fretLabelsHeight: "1.5cqi",

  // TODO: should be "fretLabels..."
  fretLabelMode: "number",
  fretLabelImage: "circle",
  fretLabelImages: {},
  fretLabelDoubles: [12, 24],
  fretLabelDoubleGap: "0.2cqi",

  showNut: true,
  nutColor: "light-dark(black, white)",
  nutWidth: "0.8cqi",

  evenFrets: false,
  showFretWires: true,
  fretWireColor: "light-dark(black, white)",
  fretWireWidth: "0.4cqi",

  showStrings: true,
  stringColor: "light-dark(black, white)",
  stringColors: {},
  stringWidth: "0.2cqi",
  stringWidths: {},
};
