"use client";

import { useId } from "react";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { Heading } from "@/components/ui/typography/Heading";
import { keyboardRanges, type KeyboardRangeName } from "@/data/keyboard/ranges";
import { keyboardThemes, type KeyboardThemeName } from "@/data/keyboard/themes";
import { KeyboardThemeSwatch } from "./InstrumentThemeSwatch";
import {
  formatKeyboardRangeNoteNames,
  keyboardRangeOptions,
  keyboardThemeOptions,
} from "./addToMusicGroupOptions";
import styles from "./AddToMusicGroupDialog.module.css";

interface KeyboardSelectorValue {
  range: KeyboardRangeName;
  theme: KeyboardThemeName;
}

interface AddKeyboardToMusicGroupPanelProps {
  value: KeyboardSelectorValue;
  onChange: (value: KeyboardSelectorValue) => void;
}

export function AddKeyboardToMusicGroupPanel({
  value,
  onChange,
}: AddKeyboardToMusicGroupPanelProps) {
  const rangeHeadingId = useId();
  const themeHeadingId = useId();

  return (
    <>
      <section className={styles.section} aria-labelledby={rangeHeadingId}>
        <div className={styles.sectionHeader}>
          <Heading as="h3" id={rangeHeadingId} size="sm" weight="semibold">
            Range
          </Heading>
        </div>

        <div className={`${styles.optionGrid} ${styles.compactGrid}`}>
          {keyboardRangeOptions.map((rangeName) => {
            const range = keyboardRanges[rangeName];

            return (
              <OptionButton
                key={rangeName}
                label={range.title}
                presentation="tile"
                selected={value.range === rangeName}
                subtitle={formatKeyboardRangeNoteNames(
                  range.midiRangeNoteNames,
                )}
                onClick={() => onChange({ ...value, range: rangeName })}
              />
            );
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby={themeHeadingId}>
        <div className={styles.sectionHeader}>
          <Heading as="h3" id={themeHeadingId} size="sm" weight="semibold">
            Look
          </Heading>
        </div>

        <div className={styles.optionGrid}>
          {keyboardThemeOptions.map((themeName) => {
            const theme = keyboardThemes[themeName];

            return (
              <OptionButton
                key={themeName}
                icon={<KeyboardThemeSwatch themeName={themeName} />}
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
