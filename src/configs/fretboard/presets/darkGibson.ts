import { FretboardConfig } from "@/types/fretboard";
import { guitarBase } from "@/configs/fretboard/bases/guitar";

export const darkGibson: FretboardConfig = {
  ...guitarBase,
  fretRange: [0, 22],
  leftHanded: false,

  background: "#3e2723", // Dark wood color

  fretInlayColor: "#d4af37", // Gold
  fretInlayWidth: "1.2cqi",
  fretInlayHeight: "1.2cqi",
  fretInlayImage: "square",
  fretInlayImages: {},
  fretInlayDoubleGap: "20%",

  fretLabelsPosition: "bottom",
  fretLabelsBackground: "#4e342e", // Slightly lighter dark wood
  fretLabelsColor: "#d4af37", // Gold
  fretLabelsHeight: "1.5cqi",
  fretLabelMode: "number",
  fretLabelImage: "square",
  fretLabelImages: {},
  fretLabelDoubleGap: "0.2cqi",

  nutColor: "#fff8e1", // Ivory-ish
  nutWidth: "0.8cqi",

  evenFrets: false,
  fretWireColor: "#cfd8dc", // Silver/Chrome
  fretWireWidth: "0.4cqi",

  stringColor: "#b0bec5", // Steel strings
  stringColors: {
    1: "#b0bec5",
    2: "#b0bec5",
    3: "#b0bec5",
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
