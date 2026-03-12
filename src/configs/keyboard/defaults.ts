import { type KeyboardConfig } from "@/types/keyboard/keyboard";

export const keyboardDefaults: Required<KeyboardConfig> = {
  midiRange: [48, 72], // C3 to C5 (2 octaves)

  whiteKeyColor: "light-dark(#ffffff, #e8e8e8)",
  blackKeyColor: "light-dark(#1a1a1a, #2a2a2a)",

  whiteKeyTextColor: "light-dark(#333333, #333333)",
  blackKeyTextColor: "light-dark(#ffffff, #ffffff)",

  keyBorderColor: "light-dark(#cccccc, #444444)",
  keyBorderRadius: "0 0 4px 4px",

  showKeyLabels: false,

  background: "transparent",

  blackKeyHeightPercent: 62,
  blackKeyWidthRatio: 0.58,
};
