import { type ReactNode } from "react";
import { AudioLines, Guitar, Piano, Repeat2 } from "lucide-react";
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
  "exercise-looper": "Exercise Looper",
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
    icon: <AudioLines />,
    kind: "drone",
    label: MODULE_CREATION_KIND_LABELS.drone,
    subtitle: "Sustained notes",
  },
  {
    icon: <Repeat2 />,
    kind: "exercise-looper",
    label: MODULE_CREATION_KIND_LABELS["exercise-looper"],
    subtitle: "Timed note exercises",
  },
] as const satisfies readonly ModuleCreationOption[];

export function getModuleCreationKindLabel(kind: ModuleCreationKind) {
  return MODULE_CREATION_KIND_LABELS[kind];
}
