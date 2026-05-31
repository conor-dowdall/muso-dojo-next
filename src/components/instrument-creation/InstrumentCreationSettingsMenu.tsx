"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  stringInstrumentTunings,
  stringInstruments,
} from "@musodojo/music-theory-data";
import { Guitar, Piano } from "lucide-react";
import {
  DisclosureList,
  DisclosureListChoiceItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { keyboardRanges } from "@/data/keyboard/ranges";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";
import {
  type FretboardInstrumentSelection,
  instrumentCreationDefaultMatchesSelection,
  type KeyboardInstrumentSelection,
} from "./instrumentCreationConfig";
import { type InstrumentCreationDefault } from "@/types/instrument-creation-defaults";
import { type InstrumentType } from "@/types/session";
import { FretboardInstrumentCreationPanel } from "./FretboardInstrumentCreationPanel";
import { KeyboardInstrumentCreationPanel } from "./KeyboardInstrumentCreationPanel";
import {
  formatKeyboardMidiRange,
  formatKeyboardRangeNoteNames,
  instrumentCreationOptions,
} from "./options";

const instrumentCreationIcons = {
  fretboard: <Guitar />,
  keyboard: <Piano />,
} as const satisfies Record<InstrumentType, ReactNode>;

export interface InstrumentCreationSettingsMenuProps {
  closeSignal?: number;
  defaultInstrumentSetup?: InstrumentCreationDefault;
  fretboardSelection: FretboardInstrumentSelection;
  instrumentType: InstrumentType;
  keyboardSelection: KeyboardInstrumentSelection;
  onChoiceOpen?: () => void;
  onFretboardSelectionChange: (value: FretboardInstrumentSelection) => void;
  onInstrumentTypeChange: (value: InstrumentType) => void;
  onKeyboardSelectionChange: (value: KeyboardInstrumentSelection) => void;
}

export function InstrumentCreationSettingsMenu({
  closeSignal = 0,
  defaultInstrumentSetup,
  fretboardSelection,
  instrumentType,
  keyboardSelection,
  onChoiceOpen,
  onFretboardSelectionChange,
  onInstrumentTypeChange,
  onKeyboardSelectionChange,
}: InstrumentCreationSettingsMenuProps) {
  const [localCloseSignal, setLocalCloseSignal] = useState(0);
  const {
    closeAll,
    closeChoice,
    open: openInstrumentChoice,
    openChoice,
  } = useDisclosureList<InstrumentType>();
  const resolvedCloseSignal = closeSignal + localCloseSignal;

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  const handleInstrumentToggle = (instrumentChoice: InstrumentType) => {
    const isSelected = instrumentType === instrumentChoice;

    if (openChoice === instrumentChoice) {
      setLocalCloseSignal((currentSignal) => currentSignal + 1);
      closeChoice(instrumentChoice);
      return;
    }

    if (!isSelected) {
      setLocalCloseSignal((currentSignal) => currentSignal + 1);
      onInstrumentTypeChange(instrumentChoice);
    }

    onChoiceOpen?.();
    openInstrumentChoice(instrumentChoice);
  };

  return (
    <DisclosureList aria-label="Views">
      {instrumentCreationOptions.map((option) => {
        const isSelected = instrumentType === option.id;
        const isDefault = instrumentCreationDefaultMatchesSelection(
          option.id,
          defaultInstrumentSetup,
          keyboardSelection,
          fretboardSelection,
        );
        const isOpen = openChoice === option.id;
        const summary =
          option.id === "keyboard"
            ? formatKeyboardSummary(keyboardSelection)
            : formatFretboardSummary(fretboardSelection);

        return (
          <DisclosureListChoiceItem
            key={option.id}
            ariaLabel={`${option.title}, ${summary}${
              isSelected ? ", selected" : ""
            }${isDefault ? ", default" : ""}`}
            isOpen={isOpen}
            icon={instrumentCreationIcons[option.id]}
            keepMounted
            label={option.title}
            panelVariant="menu"
            preview={isDefault ? "Default" : undefined}
            selected={isSelected}
            subtitle={summary}
            onToggle={() => handleInstrumentToggle(option.id)}
          >
            {option.id === "keyboard" ? (
              <KeyboardInstrumentCreationPanel
                closeSignal={resolvedCloseSignal}
                value={keyboardSelection}
                onChange={onKeyboardSelectionChange}
                onChoiceOpen={onChoiceOpen}
              />
            ) : (
              <FretboardInstrumentCreationPanel
                closeSignal={resolvedCloseSignal}
                value={fretboardSelection}
                onChange={onFretboardSelectionChange}
                onChoiceOpen={onChoiceOpen}
              />
            )}
          </DisclosureListChoiceItem>
        );
      })}
    </DisclosureList>
  );
}

function formatKeyboardSummary(selection: KeyboardInstrumentSelection) {
  const range =
    selection.range === "custom" ? undefined : keyboardRanges[selection.range];
  const rangeTitle = range?.title ?? "Custom Range";
  const rangeNotes = range
    ? formatKeyboardRangeNoteNames(range.midiRangeNoteNames)
    : formatKeyboardMidiRange(selection.midiRange);

  return `${rangeTitle}${DISPLAY_VALUE_SEPARATOR}${rangeNotes}`;
}

function formatFretboardSummary(selection: FretboardInstrumentSelection) {
  return `${stringInstruments[selection.instrument].primaryName}${DISPLAY_VALUE_SEPARATOR}${
    stringInstrumentTunings[selection.tuningKey].primaryName
  }`;
}
