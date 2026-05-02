"use client";

import { useEffect } from "react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  RangeSlider,
  RangeSliderGroup,
} from "@/components/ui/range-slider/RangeSlider";
import { keyboardRanges, type KeyboardRangeName } from "@/data/keyboard/ranges";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import { MIDI_MAX, MIDI_MIN } from "@/utils/keyboard/keyboardGeometry";
import {
  ChoiceAccordion,
  ChoiceAccordionItem,
  useChoiceAccordion,
} from "./ChoiceAccordion";
import { KeyboardThemeSwatch } from "./InstrumentThemeSwatch";
import {
  formatKeyboardRangeNoteNames,
  keyboardRangeOptions,
  keyboardThemeOptions,
} from "./addToMusicGroupOptions";
import styles from "./AddToMusicGroupDialog.module.css";

export type KeyboardRangeSelection = KeyboardRangeName | "custom";

const MIN_KEYBOARD_RANGE_SPAN = 11;

type KeyboardChoice = "range" | "style";

interface KeyboardSelectorValue {
  range: KeyboardRangeSelection;
  midiRange: readonly [number, number];
  theme: KeyboardThemeName;
}

interface AddKeyboardToMusicGroupPanelProps {
  closeSignal?: number;
  value: KeyboardSelectorValue;
  onChange: (value: KeyboardSelectorValue) => void;
  onChoiceOpen?: () => void;
}

export function AddKeyboardToMusicGroupPanel({
  closeSignal,
  value,
  onChange,
  onChoiceOpen,
}: AddKeyboardToMusicGroupPanelProps) {
  const { closeAll, closeChoice, openChoice, toggleChoice } =
    useChoiceAccordion<KeyboardChoice>();

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
  const rangeLabel =
    selectedRange?.title ?? formatKeyboardMidiRange(value.midiRange);
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
    closeChoice("style");
  };

  return (
    <section className={styles.section} aria-label="Keyboard settings">
      <ChoiceAccordion>
        <ChoiceAccordionItem
          ariaLabel={`Choose keyboard range, ${rangeLabel}, ${rangeDescription} selected`}
          isOpen={openChoice === "range"}
          label={rangeLabel}
          onToggle={() => handleToggleChoice("range")}
        >
          <div className={styles.disclosureList}>
            {keyboardRangeOptions.map((rangeName) => {
              const range = keyboardRanges[rangeName];

              return (
                <OptionButton
                  key={rangeName}
                  label={range.title}
                  presentation="list"
                  preview={formatKeyboardRangeNoteNames(
                    range.midiRangeNoteNames,
                  )}
                  selected={areRangesEqual(value.midiRange, range.midiRange)}
                  onClick={() => handleRangeSelect(rangeName)}
                />
              );
            })}
          </div>

          <RangeFieldset
            max={MIDI_MAX}
            min={MIDI_MIN}
            value={value.midiRange}
            valueFormatter={formatMidiNote}
            onChange={handleMidiRangeChange}
          />
        </ChoiceAccordionItem>

        <ChoiceAccordionItem
          ariaLabel={`Choose style, ${selectedTheme.title} selected`}
          isOpen={openChoice === "style"}
          label={selectedTheme.title}
          preview={<KeyboardThemeSwatch themeName={value.theme} />}
          onToggle={() => handleToggleChoice("style")}
        >
          <div className={styles.disclosureList}>
            {keyboardThemeOptions.map((themeName) => {
              const theme = keyboardThemes[themeName];

              return (
                <OptionButton
                  key={themeName}
                  label={theme.title}
                  presentation="list"
                  preview={<KeyboardThemeSwatch themeName={themeName} />}
                  selected={value.theme === themeName}
                  onClick={() => handleThemeSelect(themeName)}
                />
              );
            })}
          </div>
        </ChoiceAccordionItem>
      </ChoiceAccordion>
    </section>
  );
}

function RangeFieldset({
  max,
  min,
  onChange,
  value,
  valueFormatter,
}: {
  max: number;
  min: number;
  onChange: (value: readonly [number, number]) => void;
  value: readonly [number, number];
  valueFormatter: (value: number) => string;
}) {
  const [start, end] = value;
  const setStart = (nextStart: number) => {
    if (!Number.isFinite(nextStart)) return;
    onChange(
      normalizeRange(
        [nextStart, Math.max(nextStart + MIN_KEYBOARD_RANGE_SPAN, end)],
        min,
        max,
        MIN_KEYBOARD_RANGE_SPAN,
      ),
    );
  };
  const setEnd = (nextEnd: number) => {
    if (!Number.isFinite(nextEnd)) return;
    onChange(
      normalizeRange(
        [Math.min(start, nextEnd - MIN_KEYBOARD_RANGE_SPAN), nextEnd],
        min,
        max,
        MIN_KEYBOARD_RANGE_SPAN,
      ),
    );
  };

  return (
    <RangeSliderGroup>
      <RangeSlider
        label="Lowest note"
        max={max}
        min={min}
        value={start}
        valueLabel={valueFormatter(start)}
        onChange={(event) => setStart(event.currentTarget.valueAsNumber)}
      />
      <RangeSlider
        label="Highest note"
        max={max}
        min={min}
        value={end}
        valueLabel={valueFormatter(end)}
        onChange={(event) => setEnd(event.currentTarget.valueAsNumber)}
      />
    </RangeSliderGroup>
  );
}

function normalizeRange(
  [start, end]: readonly [number, number],
  min: number,
  max: number,
  minSpan: number,
) {
  let normalizedStart = clamp(Math.floor(start), min, max - minSpan);
  let normalizedEnd = clamp(Math.floor(end), min + minSpan, max);

  if (normalizedEnd - normalizedStart < minSpan) {
    normalizedEnd = Math.min(max, normalizedStart + minSpan);
    normalizedStart = Math.max(min, normalizedEnd - minSpan);
  }

  return [normalizedStart, normalizedEnd] as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function areRangesEqual(
  a: readonly [number, number],
  b: readonly [number, number],
) {
  return a[0] === b[0] && a[1] === b[1];
}

function getKeyboardRangeName(
  midiRange: readonly [number, number],
): KeyboardRangeName | undefined {
  return keyboardRangeOptions.find((rangeName) =>
    areRangesEqual(midiRange, keyboardRanges[rangeName].midiRange),
  );
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function formatMidiNote(midi: number) {
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
}

function formatKeyboardMidiRange([start, end]: readonly [number, number]) {
  return `${formatMidiNote(start)} to ${formatMidiNote(end)}`;
}
