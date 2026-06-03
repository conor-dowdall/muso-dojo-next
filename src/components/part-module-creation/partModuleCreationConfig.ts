import {
  type InstrumentType,
  type PartModuleCreationRequest,
  type PartModuleType,
} from "@/types/session";
import { assertNever } from "@/utils/assertNever";
import {
  getInstrumentPartModuleCreationConfig,
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";

export interface InstrumentPartModuleCreationDraft {
  moduleType: "instrument";
  instrumentType: InstrumentType;
  keyboardSelection: KeyboardInstrumentSelection;
  fretboardSelection: FretboardInstrumentSelection;
}

export interface DronePartModuleCreationDraft {
  moduleType: "drone";
}

export type PartModuleCreationDraft =
  | DronePartModuleCreationDraft
  | InstrumentPartModuleCreationDraft;

export const partModuleCreationOptions = [
  {
    id: "instrument",
    label: "Instrument",
    subtitle: "Fretboard or Keyboard",
  },
  {
    id: "drone",
    label: "Drone",
    subtitle: "Sustained root tone",
  },
] as const satisfies readonly {
  id: PartModuleType;
  label: string;
  subtitle: string;
}[];

export function getPartModuleCreationActionLabel(
  draft: PartModuleCreationDraft,
) {
  switch (draft.moduleType) {
    case "drone":
      return "Add Drone";
    case "instrument":
      return draft.instrumentType === "keyboard"
        ? "Add Keyboard"
        : "Add Fretboard";
    default:
      return assertNever(draft, "Unsupported part module type");
  }
}

export function getPartModuleCreationRequest(
  draft: PartModuleCreationDraft,
): PartModuleCreationRequest {
  switch (draft.moduleType) {
    case "drone":
      return {
        type: draft.moduleType,
      };
    case "instrument":
      return {
        type: draft.moduleType,
        settings: getInstrumentPartModuleCreationConfig(
          draft.instrumentType,
          draft.keyboardSelection,
          draft.fretboardSelection,
        ),
      };
    default:
      return assertNever(draft, "Unsupported part module type");
  }
}
