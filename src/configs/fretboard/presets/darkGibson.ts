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
  fretInlayImage: "circle",
  fretInlayImages: {},
  fretInlayDoubleGap: "20%",

  fretLabelsPosition: "bottom",
  fretLabelsBackground: "#4e342e", // Slightly lighter dark wood
  fretLabelsColor: "#e7e0cbff", // Gold
  fretLabelsHeight: "1.5cqi",
  fretLabelMode: "number",
  fretLabelImage: "circle",
  fretLabelImages: {},
  fretLabelDoubleGap: "0.2cqi",

  nutColor: "#fff8e1", // Ivory-ish
  nutWidth: "0.8cqi",

  evenFrets: false,
  fretWireColor: "#cfd8dc", // Silver/Chrome
  fretWireWidth: "0.4cqi",
} as const;
