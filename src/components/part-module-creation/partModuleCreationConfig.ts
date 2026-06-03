import {
  type InstrumentType,
  type PartModuleCreationRequest,
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

export type PartModuleCreationDraft = InstrumentPartModuleCreationDraft;

export function getPartModuleCreationActionLabel(
  draft: PartModuleCreationDraft,
) {
  switch (draft.moduleType) {
    case "instrument":
      return draft.instrumentType === "keyboard"
        ? "Add Keyboard"
        : "Add Fretboard";
    default:
      return assertNever(draft.moduleType, "Unsupported part module type");
  }
}

export function getPartModuleCreationRequest(
  draft: PartModuleCreationDraft,
): PartModuleCreationRequest {
  switch (draft.moduleType) {
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
      return assertNever(draft.moduleType, "Unsupported part module type");
  }
}
