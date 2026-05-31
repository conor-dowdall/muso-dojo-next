import {
  FretboardInlayPresetSwatch,
  KeyboardThemeSwatch,
} from "@/components/instrument/InstrumentThemeSwatch";
import { DefaultPreferenceAction } from "@/components/ui/default-preference-action";
import { DEFAULT_FRETBOARD_INLAY_PRESET } from "@/data/fretboard/inlayPresets";
import { getDefaultFretboardWoodThemeName } from "@/data/fretboard/instrumentDefaults";
import { type InstrumentType } from "@/types/session";
import {
  formatFretboardDefaultSetupSummary,
  formatKeyboardDefaultSetupSummary,
} from "./instrumentCreationCopy";
import {
  type FretboardInstrumentSelection,
  type KeyboardInstrumentSelection,
} from "./instrumentCreationConfig";

interface InstrumentCreationDefaultActionProps {
  fretboardSelection: FretboardInstrumentSelection;
  instrumentType: InstrumentType;
  isDefault: boolean;
  keyboardSelection: KeyboardInstrumentSelection;
  onRemember: () => void;
}

export function InstrumentCreationDefaultAction({
  fretboardSelection,
  instrumentType,
  isDefault,
  keyboardSelection,
  onRemember,
}: InstrumentCreationDefaultActionProps) {
  const setupCopy =
    instrumentType === "keyboard"
      ? getKeyboardSetupCopy(keyboardSelection)
      : getFretboardSetupCopy(fretboardSelection);

  return (
    <DefaultPreferenceAction
      actionAriaLabel={`Remember ${setupCopy.instrumentLabel.toLowerCase()} setup for new instruments`}
      isDefault={isDefault}
      preview={setupCopy.preview}
      savedAriaLabel={`${setupCopy.instrumentLabel} setup is used for new instruments`}
      subtitle={setupCopy.summary}
      targetLabel="New Instruments"
      valueLabel="This Setup"
      variant="row"
      onClick={onRemember}
    />
  );
}

function getKeyboardSetupCopy(selection: KeyboardInstrumentSelection) {
  return {
    instrumentLabel: "Keyboard",
    preview: <KeyboardThemeSwatch themeName={selection.theme} />,
    summary: formatKeyboardDefaultSetupSummary(),
  };
}

function getFretboardSetupCopy(selection: FretboardInstrumentSelection) {
  const themeName =
    selection.appearanceSource === "auto"
      ? getDefaultFretboardWoodThemeName(selection.instrument)
      : selection.theme;
  const presetName =
    selection.appearanceSource === "auto"
      ? DEFAULT_FRETBOARD_INLAY_PRESET
      : selection.inlayPreset;

  return {
    instrumentLabel: "Fretboard",
    preview: (
      <FretboardInlayPresetSwatch
        handedness={selection.handedness}
        instrument={selection.instrument}
        presetName={presetName}
        themeName={themeName}
      />
    ),
    summary: formatFretboardDefaultSetupSummary(selection),
  };
}
