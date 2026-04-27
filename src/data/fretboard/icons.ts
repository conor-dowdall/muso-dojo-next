export const fretboardIconNames = [
  "circle",
  "square",
  "star",
  "triangle",
  "trapezoid",
] as const;

export type FretboardIcon = (typeof fretboardIconNames)[number];
