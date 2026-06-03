"use client";

import { InstrumentCreationSettingsMenu } from "@/components/instrument-creation/InstrumentCreationSettingsMenu";
import {
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "@/components/instrument-creation/instrumentCreationConfig";
import { type InstrumentCreationDefault } from "@/types/instrument-creation-defaults";
import { type InstrumentType } from "@/types/session";
import { assertNever } from "@/utils/assertNever";

interface InstrumentPartModuleCreationSettingsMenuProps {
  closeSignal?: number;
  defaultInstrumentSetup?: InstrumentCreationDefault;
  fretboardSelection: FretboardInstrumentSelection;
  instrumentType: InstrumentType;
  keyboardSelection: KeyboardInstrumentSelection;
  moduleType: "instrument";
  onChoiceOpen?: () => void;
  onFretboardSelectionChange: (value: FretboardInstrumentSelection) => void;
  onInstrumentTypeChange: (value: InstrumentType) => void;
  onKeyboardSelectionChange: (value: KeyboardInstrumentSelection) => void;
}

interface DronePartModuleCreationSettingsMenuProps {
  moduleType: "drone";
}

export type PartModuleCreationSettingsMenuProps =
  | DronePartModuleCreationSettingsMenuProps
  | InstrumentPartModuleCreationSettingsMenuProps;

export function PartModuleCreationSettingsMenu(
  props: PartModuleCreationSettingsMenuProps,
) {
  switch (props.moduleType) {
    case "drone":
      return null;
    case "instrument":
      return (
        <InstrumentCreationSettingsMenu
          closeSignal={props.closeSignal}
          defaultInstrumentSetup={props.defaultInstrumentSetup}
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
      return assertNever(props, "Unsupported part module type");
  }
}
