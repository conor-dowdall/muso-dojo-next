import { type ReactNode } from "react";
import { Guitar, Piano, RadioTower } from "lucide-react";
import { type ModuleCreationKind } from "@/types/instrument-creation-defaults";

export interface ModuleCreationOption {
  icon: ReactNode;
  kind: ModuleCreationKind;
  label: string;
  subtitle: string;
}

export const MODULE_CREATION_KIND_LABELS = {
  drone: "Drone",
  fretboard: "Fretboard",
  keyboard: "Keyboard",
} as const satisfies Record<ModuleCreationKind, string>;

/**
 * Canonical module creation menu copy and iconography. Add new module kinds
 * here before wiring them into Add to Part or Add to Session surfaces.
 */
export const MODULE_CREATION_OPTIONS = [
  {
    icon: <Guitar />,
    kind: "fretboard",
    label: MODULE_CREATION_KIND_LABELS.fretboard,
    subtitle: "String instrument view",
  },
  {
    icon: <Piano />,
    kind: "keyboard",
    label: MODULE_CREATION_KIND_LABELS.keyboard,
    subtitle: "Piano key view",
  },
  {
    icon: <RadioTower />,
    kind: "drone",
    label: MODULE_CREATION_KIND_LABELS.drone,
    subtitle: "Sustained root tone",
  },
] as const satisfies readonly ModuleCreationOption[];

export function getModuleCreationKindLabel(kind: ModuleCreationKind) {
  return MODULE_CREATION_KIND_LABELS[kind];
}
