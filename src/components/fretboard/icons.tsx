import { type ElementType } from "react";
import { type LucideProps, Circle, PawPrint } from "lucide-react";
import { Trapezoid } from "@/components/icons/fretboardIcons";
import { type FretboardIcon } from "@/data/fretboard/icons";

export const fretboardIcons = {
  circle: Circle,
  "paw-print": PawPrint,
  trapezoid: Trapezoid,
} as const satisfies Record<FretboardIcon, ElementType<LucideProps>>;
