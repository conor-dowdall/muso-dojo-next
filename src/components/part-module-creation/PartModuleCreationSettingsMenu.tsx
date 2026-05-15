"use client";

import { InstrumentCreationSettingsMenu } from "@/components/instrument-creation/InstrumentCreationSettingsMenu";
import {
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import { type InstrumentType } from "@/types/session";
import { assertNever } from "@/utils/assertNever";

interface InstrumentPartModuleCreationSettingsMenuProps {
  closeSignal?: number;
  fretboardSelection: FretboardInstrumentSelection;
  instrumentType: InstrumentType;
  keyboardSelection: KeyboardInstrumentSelection;
  moduleType: "instrument";
  onChoiceOpen?: () => void;
  onFretboardSelectionChange: (value: FretboardInstrumentSelection) => void;
  onInstrumentTypeChange: (value: InstrumentType) => void;
  onKeyboardSelectionChange: (value: KeyboardInstrumentSelection) => void;
}

export type PartModuleCreationSettingsMenuProps =
  InstrumentPartModuleCreationSettingsMenuProps;

export function PartModuleCreationSettingsMenu(
  props: PartModuleCreationSettingsMenuProps,
) {
  switch (props.moduleType) {
    case "instrument":
      return (
        <InstrumentCreationSettingsMenu
          closeSignal={props.closeSignal}
          fretboardSelection={props.fretboardSelection}
          instrumentType={props.instrumentType}
          keyboardSelection={props.keyboardSelection}
          onChoiceOpen={props.onChoiceOpen}
          onFretboardSelectionChange={props.onFretboardSelectionChange}
          onInstrumentTypeChange={props.onInstrumentTypeChange}
          onKeyboardSelectionChange={props.onKeyboardSelectionChange}
        />
      );
    default:
      return assertNever(props.moduleType, "Unsupported part module type");
  }
}
