import {
  enharmonicRootNoteGroups,
  type RootNote,
} from "@musodojo/music-theory-data";
import { Button } from "@/components/ui/buttons/Button";
import styles from "./RootNotePicker.module.css";

interface RootNoteGridProps {
  value: string;
  onChange: (rootNote: RootNote) => void;
}

export function RootNoteGrid({ value, onChange }: RootNoteGridProps) {
  return (
    <div className={styles.rootNoteList}>
      {enharmonicRootNoteGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={styles.rootNoteGroup}>
          {group.map((note) => (
            <Button
              key={note}
              className={styles.rootNoteButton}
              label={note}
              selected={value === note}
              onClick={() => onChange(note)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
