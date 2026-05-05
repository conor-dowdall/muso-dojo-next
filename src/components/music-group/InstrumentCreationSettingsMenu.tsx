"use client";

import { useState } from "react";
import {
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import {
  DisclosureList,
  DisclosureListItem,
} from "@/components/ui/disclosure-list/DisclosureList";
import {
  DEFAULT_FRETBOARD_THEME,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { DEFAULT_KEYBOARD_RANGE, keyboardRanges } from "@/data/keyboard/ranges";
import {
  DEFAULT_KEYBOARD_THEME,
  type KeyboardThemeName,
} from "@/data/keyboard/themes";
import { type InstrumentCreationConfig } from "@/types/workspace";
import { AddFretboardToMusicGroupPanel } from "./AddFretboardToMusicGroupPanel";
import {
  AddKeyboardToMusicGroupPanel,
  type KeyboardRangeSelection,
} from "./AddKeyboardToMusicGroupPanel";
import {
  addableMusicGroupOptions,
  type AddableMusicGroupItemType,
} from "./addToMusicGroupOptions";

export interface KeyboardInstrumentSelection {
  range: KeyboardRangeSelection;
  midiRange: readonly [number, number];
  theme: KeyboardThemeName;
}

export interface FretboardInstrumentSelection {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  fretRange: readonly [number, number];
  handedness: "right" | "left";
  theme: FretboardThemeName;
}

interface InstrumentCreationSettingsMenuProps {
  closeSignal?: number;
  fretboardSelection: FretboardInstrumentSelection;
  instrumentType: AddableMusicGroupItemType;
  keyboardSelection: KeyboardInstrumentSelection;
  onChoiceOpen?: () => void;
  onFretboardSelectionChange: (value: FretboardInstrumentSelection) => void;
  onInstrumentTypeChange: (value: AddableMusicGroupItemType) => void;
  onKeyboardSelectionChange: (value: KeyboardInstrumentSelection) => void;
}

export const defaultKeyboardInstrumentSelection: KeyboardInstrumentSelection = {
  range: DEFAULT_KEYBOARD_RANGE,
  midiRange: keyboardRanges[DEFAULT_KEYBOARD_RANGE].midiRange,
  theme: DEFAULT_KEYBOARD_THEME,
};

export const defaultFretboardInstrumentSelection: FretboardInstrumentSelection =
  {
    instrument: "guitar",
    tuningKey: stringInstruments.guitar.defaultTuning,
    fretRange: [0, 12],
    handedness: "right",
    theme: DEFAULT_FRETBOARD_THEME,
  };

export function getKeyboardInstrumentCreationConfig(
  selection: KeyboardInstrumentSelection,
): InstrumentCreationConfig<"keyboard"> {
  return {
    ...(selection.range === "custom"
      ? { config: { midiRange: selection.midiRange } }
      : { range: selection.range }),
    theme: selection.theme,
  };
}

export function getFretboardInstrumentCreationConfig(
  selection: FretboardInstrumentSelection,
): InstrumentCreationConfig<"fretboard"> {
  return {
    theme: selection.theme,
    config: {
      instrument: selection.instrument,
      tuningKey: selection.tuningKey,
      fretRange: [...selection.fretRange],
      leftHanded: selection.handedness === "left",
    },
  };
}

export function getInstrumentCreationConfig(
  instrumentType: AddableMusicGroupItemType,
  keyboardSelection: KeyboardInstrumentSelection,
  fretboardSelection: FretboardInstrumentSelection,
): InstrumentCreationConfig {
  return instrumentType === "keyboard"
    ? getKeyboardInstrumentCreationConfig(keyboardSelection)
    : getFretboardInstrumentCreationConfig(fretboardSelection);
}

export function InstrumentCreationSettingsMenu({
  closeSignal = 0,
  fretboardSelection,
  instrumentType,
  keyboardSelection,
  onChoiceOpen,
  onFretboardSelectionChange,
  onInstrumentTypeChange,
  onKeyboardSelectionChange,
}: InstrumentCreationSettingsMenuProps) {
  const [localCloseSignal, setLocalCloseSignal] = useState(0);
  const resolvedCloseSignal = closeSignal + localCloseSignal;

  return (
    <DisclosureList>
      {addableMusicGroupOptions.map((option) => {
        const isSelected = instrumentType === option.id;

        return (
          <DisclosureListItem
            key={option.id}
            ariaLabel={`Choose ${option.title}`}
            isOpen={isSelected}
            keepMounted
            label={option.title}
            panelVariant="menu"
            selected={isSelected}
            showSelectionIndicator
            onToggle={() => {
              if (!isSelected) {
                setLocalCloseSignal((currentSignal) => currentSignal + 1);
                onChoiceOpen?.();
              }

              onInstrumentTypeChange(option.id);
            }}
          >
            {option.id === "keyboard" ? (
              <AddKeyboardToMusicGroupPanel
                closeSignal={resolvedCloseSignal}
                value={keyboardSelection}
                onChange={onKeyboardSelectionChange}
                onChoiceOpen={onChoiceOpen}
              />
            ) : (
              <AddFretboardToMusicGroupPanel
                closeSignal={resolvedCloseSignal}
                value={fretboardSelection}
                onChange={onFretboardSelectionChange}
                onChoiceOpen={onChoiceOpen}
              />
            )}
          </DisclosureListItem>
        );
      })}
    </DisclosureList>
  );
}
