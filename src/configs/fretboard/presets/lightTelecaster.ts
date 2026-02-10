import { FretboardConfig } from "@/types/fretboard";
import { guitarBase } from "@/configs/fretboard/bases/guitar";

export const lightTelecaster: FretboardConfig = {
  ...guitarBase,
  fretRange: [0, 22],
  leftHanded: false,

  background: "linear-gradient(to top right, #c0750d, #8e5509)",

  fretInlayColor: "linear-gradient(to top right, #323232ff, #575757ff)",
  fretInlayWidth: "1.5cqi",
  fretInlayHeight: "1.5cqi",
  fretInlayImage: "circle",
  fretInlayImages: {},
  fretInlayDoubleGap: "20%",

  fretLabelsPosition: "bottom",
  fretLabelsBackground: "linear-gradient(to top right, #cba857, #c09d52)",
  fretLabelsColor: "black",
  fretLabelsHeight: "1.5cqi",
  fretLabelMode: "image",
  fretLabelImage: "star",
  fretLabelImages: {},
  fretLabelDoubleGap: "0.2cqi",

  nutColor: "linear-gradient(to top right, #e4cda2, #ceb992)",
  nutWidth: "0.8cqi",

  evenFrets: false,
  fretWireColor: "linear-gradient(to top right, #e2d6b9, #b0a690)",
  fretWireWidth: "0.4cqi",
} as const;
