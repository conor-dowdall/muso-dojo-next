import { type FretboardConfig } from "@/types/fretboard";
import { guitarBase } from "@/configs/fretboard/bases/guitar";

export const darkGibson: FretboardConfig = {
  ...guitarBase,
  fretRange: [0, 22],

  background: "linear-gradient(to top right, #7e3613, #583129)",

  fretInlayColor: "#cbc8c8ff",
  fretInlayWidth: "75%",
  fretInlayHeight: "80%",
  fretInlayImage: "trapezoid",
  fretInlayDoubles: [],

  fretLabelsBackground: "linear-gradient(to top right, #bba164ff, #978152ff)",
  fretLabelColor: "black",
  fretLabelMode: "image",
  fretLabelImage: "circle",
  fretLabelDoubleGap: "0.2cqi",

  nutColor: "linear-gradient(to top right, #e3dccfff, #bcb7ae)",

  fretWireColor: "#cfd8dc",
} as const;
