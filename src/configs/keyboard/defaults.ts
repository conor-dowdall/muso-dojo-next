import { type KeyboardConfig } from "@/types/keyboard/keyboard";

export const keyboardDefaults: Required<KeyboardConfig> = {
  midiRange: [48, 73],

  whiteKeyColor: "white",
  blackKeyColor: "black",

  whiteKeyTextColor: "black",
  blackKeyTextColor: "white",

  keyBorderColor: "darkgray",
  keyBorderRadius: "0 0 4px 4px",

  showKeyLabels: false,

  background: "transparent",

  blackKeyHeightPercent: 62,
  blackKeyWidthRatio: 0.58,
};
