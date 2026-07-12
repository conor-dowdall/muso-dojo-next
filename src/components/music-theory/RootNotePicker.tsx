"use client";

import {
  enharmonicRootNoteGroups,
  type RootNote,
} from "@musodojo/music-theory-data";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import choiceGridStyles from "@/components/ui/choice-grid/ChoiceGrid.module.css";
import styles from "./RootNotePicker.module.css";

interface RootNotePickerProps {
  value: string;
  onChange: (rootNote: RootNote) => void;
}

export function RootNotePicker({ value, onChange }: RootNotePickerProps) {
  return (
    <div className={styles.rootNoteList}>
      {enharmonicRootNoteGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={styles.rootNoteGroup}>
          {group.map((note) => (
            <OptionButton
              key={note}
              className={`${choiceGridStyles.tokenChoice} ${styles.rootNoteButton}`}
              fullWidth={false}
              label={note}
              presentation="tile"
              selected={value === note}
              onClick={() => onChange(note)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
