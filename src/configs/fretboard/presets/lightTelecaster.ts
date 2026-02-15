import { type FretboardConfig } from "@/types/fretboard";
import { guitarBase } from "@/configs/fretboard/bases/guitar";

export const lightTelecaster: FretboardConfig = {
  ...guitarBase,
  fretRange: [0, 22],

  background: "linear-gradient(to top right, #c0750d, #8e5509)",

  fretInlayColor: "black",
  fretInlayWidth: "1.5cqi",
  fretInlayHeight: "1.5cqi",
  fretInlayImage: "circle",
  fretInlayDoubleGap: "20%",

  fretLabelsBackground: "linear-gradient(to top right, #cba857, #c09d52)",
  fretLabelColor: "black",
  fretLabelMode: "image",
  fretLabelImage: "circle",
  fretLabelDoubleGap: "0.2cqi",

  nutColor: "linear-gradient(to top right, #e4cda2, #ceb992)",

  fretWireColor: "linear-gradient(to top right, #e2d6b9, #b0a690)",
} as const;
