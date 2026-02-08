import { Circle, Square, Star, Triangle } from "lucide-react";

export const fretboardIcons = {
  circle: Circle,
  square: Square,
  star: Star,
  triangle: Triangle,
} as const;

export type FretboardIcon = keyof typeof fretboardIcons;
