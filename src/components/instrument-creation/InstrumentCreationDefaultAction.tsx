import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { DisclosureListAction } from "@/components/ui/disclosure-list/DisclosureList";
import {
  FretboardInlayPresetSwatch,
  KeyboardThemeSwatch,
} from "@/components/instrument/InstrumentThemeSwatch";
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
    <DisclosureListAction
      aria-label={
        isDefault
          ? `${setupCopy.instrumentLabel} setup is the default for new instruments`
          : `Remember ${setupCopy.instrumentLabel.toLowerCase()} setup for new instruments`
      }
      disabled={isDefault}
      icon={isDefault ? <BookmarkCheck /> : <BookmarkPlus />}
      label={
        isDefault
          ? "Used for New Instruments"
          : "Use This Setup for New Instruments"
      }
      preview={setupCopy.preview}
      selected={isDefault}
      subtitle={setupCopy.summary}
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
