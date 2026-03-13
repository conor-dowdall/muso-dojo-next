import { type KeyboardConfig } from "@/types/keyboard/keyboard";

export const keyboardDefaults: Required<KeyboardConfig> = {
  midiRange: [48, 72], // C3 to C5 (2 octaves)

  whiteKeyColor: "white",
  blackKeyColor: "black",

  whiteKeyTextColor: "black",
  blackKeyTextColor: "white",

  keyBorderColor: "black",
  keyBorderRadius: "0 0 4px 4px",

  showKeyLabels: false,

  background: "transparent",

  blackKeyHeightPercent: 62,
  blackKeyWidthRatio: 0.58,
};
