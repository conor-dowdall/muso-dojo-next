"use client";

import { useId } from "react";
import {
  stringInstrumentTunings,
  stringInstruments,
  type StringInstrumentKey,
  type StringInstrumentTuningKey,
} from "@musodojo/music-theory-data";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Heading } from "@/components/ui/typography/Heading";
import {
  fretboardThemes,
  type FretboardThemeName,
} from "@/data/fretboard/themes";
import { FretboardThemeSwatch } from "./InstrumentThemeSwatch";
import {
  formatOpenStringNotes,
  fretboardInstrumentGroups,
  fretboardThemeOptions,
  getFretboardTuningGroups,
} from "./addToMusicGroupOptions";
import styles from "./AddToMusicGroupDialog.module.css";

interface FretboardSelectorValue {
  instrument: StringInstrumentKey;
  tuningKey: StringInstrumentTuningKey;
  theme: FretboardThemeName;
}

interface AddFretboardToMusicGroupPanelProps {
  value: FretboardSelectorValue;
  onChange: (value: FretboardSelectorValue) => void;
}

export function AddFretboardToMusicGroupPanel({
  value,
  onChange,
}: AddFretboardToMusicGroupPanelProps) {
  const instrumentHeadingId = useId();
  const tuningHeadingId = useId();
  const themeHeadingId = useId();
  const selectedInstrument = stringInstruments[value.instrument];
  const tuningGroups = getFretboardTuningGroups(value.instrument);

  const handleInstrumentSelect = (instrument: StringInstrumentKey) => {
    onChange({
      ...value,
      instrument,
      tuningKey: stringInstruments[instrument].defaultTuning,
    });
  };

  return (
    <>
      <section className={styles.section} aria-labelledby={instrumentHeadingId}>
        <div className={styles.sectionHeader}>
          <Heading as="h3" id={instrumentHeadingId} size="sm" weight="semibold">
            Instrument
          </Heading>
        </div>

        <div className={styles.optionGroups}>
          {fretboardInstrumentGroups.map((group) => (
            <div key={group.title} className={styles.optionGroup}>
              <Heading as="h4" size="xs" variant="muted">
                {group.title}
              </Heading>
              <div className={`${styles.optionGrid} ${styles.compactGrid}`}>
                {group.options.map((option) => (
                  <OptionButton
                    key={option.id}
                    label={option.title}
                    presentation="tile"
                    selected={value.instrument === option.id}
                    onClick={() => handleInstrumentSelect(option.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby={tuningHeadingId}>
        <div className={styles.sectionHeader}>
          <Heading as="h3" id={tuningHeadingId} size="sm" weight="semibold">
            {selectedInstrument.primaryName} Tuning
          </Heading>
        </div>

        <div className={styles.optionGroups}>
          {tuningGroups.map((group, index) => (
            <div
              key={group.title ?? `tuning-group-${index}`}
              className={styles.optionGroup}
            >
              {group.title ? (
                <Heading as="h4" size="xs" variant="muted">
                  {group.title}
                </Heading>
              ) : null}
              <div className={`${styles.optionGrid} ${styles.compactGrid}`}>
                {group.tuningKeys.map((tuningKey) => {
                  const tuning = stringInstrumentTunings[tuningKey];

                  return (
                    <OptionButton
                      key={tuningKey}
                      label={tuning.primaryName}
                      presentation="tile"
                      selected={value.tuningKey === tuningKey}
                      subtitle={formatOpenStringNotes(tuning)}
                      onClick={() => onChange({ ...value, tuningKey })}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby={themeHeadingId}>
        <div className={styles.sectionHeader}>
          <Heading as="h3" id={themeHeadingId} size="sm" weight="semibold">
            Look
          </Heading>
        </div>

        <div className={styles.optionGrid}>
          {fretboardThemeOptions.map((themeName) => {
            const theme = fretboardThemes[themeName];

            return (
              <OptionButton
                key={themeName}
                icon={<FretboardThemeSwatch themeName={themeName} />}
                iconPosition="end"
                iconSizing="content"
                label={theme.title}
                presentation="tile"
                selected={value.theme === themeName}
                onClick={() => onChange({ ...value, theme: themeName })}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
