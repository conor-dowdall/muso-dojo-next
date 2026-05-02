"use client";

import { useEffect } from "react";
import {
  stringInstrumentTunings,
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import {
  RangeSlider,
  RangeSliderGroup,
} from "@/components/ui/range-slider/RangeSlider";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import {
  ChoiceAccordion,
  ChoiceAccordionItem,
  useChoiceAccordion,
} from "./ChoiceAccordion";
import { FretboardThemeSwatch } from "./InstrumentThemeSwatch";
import {
  formatOpenStringNotes,
  fretboardInstrumentGroups,
  fretboardThemeOptions,
  getFretboardTuningGroups,
} from "./addToMusicGroupOptions";
import styles from "./AddToMusicGroupDialog.module.css";

const FRET_RANGE_MAX = 24;
const FRET_RANGE_MIN = 0;
const MIN_FRET_RANGE_SPAN = 2;

type FretboardChoice =
  | "instrument"
  | "tuning"
  | "fretRange"
  | "handedness"
  | "style";

interface FretboardSelectorValue {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  fretRange: readonly [number, number];
  handedness: "right" | "left";
  theme: FretboardThemeName;
}

interface AddFretboardToMusicGroupPanelProps {
  closeSignal?: number;
  value: FretboardSelectorValue;
  onChange: (value: FretboardSelectorValue) => void;
  onChoiceOpen?: () => void;
}

export function AddFretboardToMusicGroupPanel({
  closeSignal,
  value,
  onChange,
  onChoiceOpen,
}: AddFretboardToMusicGroupPanelProps) {
  const { closeAll, closeChoice, openChoice, toggleChoice } =
    useChoiceAccordion<FretboardChoice>();

  useEffect(() => {
    closeAll();
  }, [closeAll, closeSignal]);

  const handleToggleChoice = (choice: FretboardChoice) => {
    if (openChoice !== choice) {
      onChoiceOpen?.();
    }
    toggleChoice(choice);
  };
  const selectedInstrument = stringInstruments[value.instrument];
  const selectedTuning = stringInstrumentTunings[value.tuningKey];
  const selectedTheme = fretboardThemes[value.theme];
  const tuningGroups = getFretboardTuningGroups(value.instrument);

  const handleInstrumentSelect = (instrument: StringInstrumentKey) => {
    onChange({
      ...value,
      instrument,
      tuningKey: stringInstruments[instrument].defaultTuning,
    });
    closeChoice("instrument");
  };
  const handleTuningSelect = (tuningKey: StringInstrumentTuningKey) => {
    onChange({ ...value, tuningKey });
    closeChoice("tuning");
  };
  const handleFretRangeSelect = (fretRange: readonly [number, number]) => {
    onChange({ ...value, fretRange });
    closeChoice("fretRange");
  };
  const handleHandednessSelect = (handedness: "right" | "left") => {
    onChange({ ...value, handedness });
    closeChoice("handedness");
  };
  const handleThemeSelect = (theme: FretboardThemeName) => {
    onChange({ ...value, theme });
    closeChoice("style");
  };
  const handleFretRangeStartChange = (start: number) => {
    onChange({
      ...value,
      fretRange: normalizeFretRange([
        start,
        Math.max(start + MIN_FRET_RANGE_SPAN, value.fretRange[1]),
      ]),
    });
  };
  const handleFretRangeEndChange = (end: number) => {
    onChange({
      ...value,
      fretRange: normalizeFretRange([
        Math.min(value.fretRange[0], end - MIN_FRET_RANGE_SPAN),
        end,
      ]),
    });
  };

  return (
    <section className={styles.section} aria-label="Fretboard settings">
      <ChoiceAccordion>
        <ChoiceAccordionItem
          ariaLabel={`Choose instrument, ${selectedInstrument.primaryName} selected`}
          isOpen={openChoice === "instrument"}
          label={selectedInstrument.primaryName}
          onToggle={() => handleToggleChoice("instrument")}
        >
          <div className={styles.disclosureGroups}>
            {fretboardInstrumentGroups.map((group) => (
              <div key={group.title} className={styles.disclosureGroup}>
                <div className={styles.disclosureList}>
                  {group.options.map((option) => (
                    <OptionButton
                      key={option.id}
                      label={option.title}
                      presentation="list"
                      selected={value.instrument === option.id}
                      onClick={() => handleInstrumentSelect(option.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ChoiceAccordionItem>

        <ChoiceAccordionItem
          ariaLabel={`Choose tuning, ${selectedTuning.primaryName} selected`}
          isOpen={openChoice === "tuning"}
          label={selectedTuning.primaryName}
          onToggle={() => handleToggleChoice("tuning")}
        >
          <div className={styles.disclosureGroups}>
            {tuningGroups.map((group, index) => (
              <div
                key={group.title ?? `tuning-group-${index}`}
                className={styles.disclosureGroup}
              >
                <div className={styles.disclosureList}>
                  {group.tuningKeys.map((tuningKey) => {
                    const tuning = stringInstrumentTunings[tuningKey];

                    return (
                      <OptionButton
                        key={tuningKey}
                        label={tuning.primaryName}
                        presentation="list"
                        preview={formatOpenStringNotes(tuning)}
                        selected={value.tuningKey === tuningKey}
                        onClick={() => handleTuningSelect(tuningKey)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ChoiceAccordionItem>

        <ChoiceAccordionItem
          ariaLabel={`Choose fret range, ${formatFretRange(value.fretRange)} selected`}
          isOpen={openChoice === "fretRange"}
          label={formatFretRange(value.fretRange)}
          onToggle={() => handleToggleChoice("fretRange")}
        >
          <div className={styles.disclosureList}>
            {fretRangeOptions.map((option) => (
              <OptionButton
                key={formatFretRange(option)}
                label={formatFretRange(option)}
                presentation="list"
                selected={areRangesEqual(value.fretRange, option)}
                onClick={() => handleFretRangeSelect(option)}
              />
            ))}
          </div>

          <RangeSliderGroup>
            <RangeSlider
              label="First fret"
              max={FRET_RANGE_MAX}
              min={FRET_RANGE_MIN}
              value={value.fretRange[0]}
              valueLabel={formatFretPosition(value.fretRange[0])}
              onChange={(event) =>
                handleFretRangeStartChange(event.currentTarget.valueAsNumber)
              }
            />
            <RangeSlider
              label="Last fret"
              max={FRET_RANGE_MAX}
              min={FRET_RANGE_MIN}
              value={value.fretRange[1]}
              valueLabel={formatFretPosition(value.fretRange[1])}
              onChange={(event) =>
                handleFretRangeEndChange(event.currentTarget.valueAsNumber)
              }
            />
          </RangeSliderGroup>
        </ChoiceAccordionItem>

        <ChoiceAccordionItem
          ariaLabel={`Choose handedness, ${formatHandedness(value.handedness)} selected`}
          isOpen={openChoice === "handedness"}
          label={formatHandedness(value.handedness)}
          onToggle={() => handleToggleChoice("handedness")}
        >
          <div className={styles.disclosureList}>
            <OptionButton
              label={formatHandedness("right")}
              presentation="list"
              selected={value.handedness === "right"}
              onClick={() => handleHandednessSelect("right")}
            />
            <OptionButton
              label={formatHandedness("left")}
              presentation="list"
              selected={value.handedness === "left"}
              onClick={() => handleHandednessSelect("left")}
            />
          </div>
        </ChoiceAccordionItem>

        <ChoiceAccordionItem
          ariaLabel={`Choose style, ${selectedTheme.title} selected`}
          isOpen={openChoice === "style"}
          label={selectedTheme.title}
          preview={<FretboardThemeSwatch themeName={value.theme} />}
          onToggle={() => handleToggleChoice("style")}
        >
          <div className={styles.disclosureList}>
            {fretboardThemeOptions.map((themeName) => {
              const theme = fretboardThemes[themeName];

              return (
                <OptionButton
                  key={themeName}
                  label={theme.title}
                  presentation="list"
                  preview={<FretboardThemeSwatch themeName={themeName} />}
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

const fretRangeOptions = [
  [0, 5],
  [0, 12],
  [0, 24],
] as const satisfies readonly (readonly [number, number])[];

function areRangesEqual(
  a: readonly [number, number],
  b: readonly [number, number],
) {
  return a[0] === b[0] && a[1] === b[1];
}

function normalizeFretRange([start, end]: readonly [number, number]) {
  const normalizedStart = Number.isFinite(start)
    ? Math.min(
        FRET_RANGE_MAX - MIN_FRET_RANGE_SPAN,
        Math.max(FRET_RANGE_MIN, Math.floor(start)),
      )
    : FRET_RANGE_MIN;
  const normalizedEnd = Number.isFinite(end)
    ? Math.min(
        FRET_RANGE_MAX,
        Math.max(FRET_RANGE_MIN + MIN_FRET_RANGE_SPAN, Math.floor(end)),
      )
    : 12;

  return normalizedEnd - normalizedStart >= MIN_FRET_RANGE_SPAN
    ? ([normalizedStart, normalizedEnd] as const)
    : ([
        normalizedStart,
        Math.min(FRET_RANGE_MAX, normalizedStart + MIN_FRET_RANGE_SPAN),
      ] as const);
}

function formatFretRange([start, end]: readonly [number, number]) {
  return `Frets ${start} to ${end}`;
}

function formatFretPosition(fret: number) {
  return `Fret ${fret}`;
}

function formatHandedness(handedness: FretboardSelectorValue["handedness"]) {
  return handedness === "right" ? "Right Handed" : "Left Handed";
}
