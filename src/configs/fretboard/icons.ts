import { Circle, Square, Star, Triangle } from "lucide-react";
import { Trapezoid } from "@/components/icons/Trapezoid";

export const fretboardIcons = {
  circle: Circle,
  square: Square,
  star: Star,
  triangle: Triangle,
  trapezoid: Trapezoid,
} as const;

export type FretboardIcon = keyof typeof fretboardIcons;
