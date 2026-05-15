"use client";

import { useEffect } from "react";
import {
  DisclosureList,
  DisclosureListChoice,
  DisclosureListItem,
  useDisclosureList,
} from "@/components/ui/disclosure-list/DisclosureList";
import { keyboardRanges, type KeyboardRangeName } from "@/data/keyboard/ranges";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import { MIDI_MAX, MIDI_MIN } from "@/utils/keyboard/keyboardGeometry";
import { areRangesEqual } from "@/utils/range/numberRange";
import { BoundedRangeSliderGroup } from "@/components/ui/range-slider/BoundedRangeSliderGroup";
import { KeyboardThemeSwatch } from "@/components/instrument/InstrumentThemeSwatch";
import { type KeyboardInstrumentSelection } from "./instrumentCreationConfig";
import {
  formatKeyboardMidiRange,
  formatKeyboardRangeNoteNames,
  formatMidiNote,
  keyboardRangeOptions,
  keyboardThemeOptions,
} from "./options";
import styles from "@/components/part-module-creation/PartModuleCreationDialog.module.css";

const MIN_KEYBOARD_RANGE_SPAN = 11;

type KeyboardChoice = "range" | "appearance";

interface KeyboardInstrumentCreationPanelProps {
  closeSignal?: number;
  value: KeyboardInstrumentSelection;
  onChange: (value: KeyboardInstrumentSelection) => void;
  onChoiceOpen?: () => void;
}

export function KeyboardInstrumentCreationPanel({
  closeSignal,
  value,
  onChange,
  onChoiceOpen,
}: KeyboardInstrumentCreationPanelProps) {
  const { closeAll, closeChoice, openChoice, toggleChoice } =
    useDisclosureList<KeyboardChoice>();

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  const handleToggleChoice = (choice: KeyboardChoice) => {
    if (openChoice !== choice) {
      onChoiceOpen?.();
    }
    toggleChoice(choice);
  };
  const selectedRangeName = getKeyboardRangeName(value.midiRange);
  const selectedRange = selectedRangeName
    ? keyboardRanges[selectedRangeName]
    : undefined;
  const selectedTheme = keyboardThemes[value.theme];
  const rangeLabel = selectedRange?.title ?? "Custom Range";
  const rangeDescription = selectedRange
    ? formatKeyboardRangeNoteNames(selectedRange.midiRangeNoteNames)
    : formatKeyboardMidiRange(value.midiRange);

  const handleRangeSelect = (rangeName: KeyboardRangeName) => {
    onChange({
      ...value,
      range: rangeName,
      midiRange: keyboardRanges[rangeName].midiRange,
    });
    closeChoice("range");
  };
  const handleMidiRangeChange = (midiRange: readonly [number, number]) => {
    onChange({
      ...value,
      range: getKeyboardRangeName(midiRange) ?? "custom",
      midiRange,
    });
  };
  const handleThemeSelect = (theme: KeyboardThemeName) => {
    onChange({ ...value, theme });
    closeChoice("appearance");
  };

  return (
    <section className={styles.section} aria-label="Keyboard settings">
      <DisclosureList>
        <DisclosureListItem
          ariaLabel={`Choose keyboard range, ${rangeLabel}, ${rangeDescription} selected`}
          isOpen={openChoice === "range"}
          keepMounted
          label="Range"
          preview={rangeDescription}
          subtitle={rangeLabel}
          onToggle={() => handleToggleChoice("range")}
        >
          <DisclosureList>
            {keyboardRangeOptions.map((rangeName) => {
              const range = keyboardRanges[rangeName];

              return (
                <DisclosureListChoice
                  key={rangeName}
                  label={range.title}
                  subtitle={formatKeyboardRangeNoteNames(
                    range.midiRangeNoteNames,
                  )}
                  selected={areRangesEqual(value.midiRange, range.midiRange)}
                  onClick={() => handleRangeSelect(rangeName)}
                />
              );
            })}
          </DisclosureList>

          <BoundedRangeSliderGroup
            endLabel="Highest note"
            max={MIDI_MAX}
            min={MIDI_MIN}
            minSpan={MIN_KEYBOARD_RANGE_SPAN}
            startLabel="Lowest note"
            value={value.midiRange}
            valueFormatter={formatMidiNote}
            onChange={handleMidiRangeChange}
          />
        </DisclosureListItem>

        <DisclosureListItem
          ariaLabel={`Choose appearance, ${selectedTheme.title} selected`}
          isOpen={openChoice === "appearance"}
          keepMounted
          label="Appearance"
          preview={<KeyboardThemeSwatch themeName={value.theme} />}
          subtitle={selectedTheme.title}
          onToggle={() => handleToggleChoice("appearance")}
        >
          <DisclosureList>
            {keyboardThemeOptions.map((themeName) => {
              const theme = keyboardThemes[themeName];

              return (
                <DisclosureListChoice
                  key={themeName}
                  label={theme.title}
                  preview={<KeyboardThemeSwatch themeName={themeName} />}
                  selected={value.theme === themeName}
                  onClick={() => handleThemeSelect(themeName)}
                />
              );
            })}
          </DisclosureList>
        </DisclosureListItem>
      </DisclosureList>
    </section>
  );
}

function getKeyboardRangeName(
  midiRange: readonly [number, number],
): KeyboardRangeName | undefined {
  return keyboardRangeOptions.find((rangeName) =>
    areRangesEqual(midiRange, keyboardRanges[rangeName].midiRange),
  );
}
