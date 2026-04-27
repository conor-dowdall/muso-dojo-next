import { enharmonicRootNoteGroups } from "@musodojo/music-theory-data";
import { useMusicGroup } from "./MusicGroupContext";
import localStyles from "./RootNotePicker.module.css";
import { Button } from "@/components/ui/buttons/Button";

interface RootNotePickerProps {
  onSelect: () => void;
}

export function RootNotePicker({ onSelect }: RootNotePickerProps) {
  const { rootNote: currentRootNote, setRootNote: onRootNoteChange } =
    useMusicGroup();
  return (
    <div className={localStyles.rootNoteList}>
      {enharmonicRootNoteGroups.map((group, groupIndex) => {
        return (
          <div key={groupIndex} className={localStyles.rootNoteGroup}>
            {group.map((note) => (
              <Button
                key={note}
                className={localStyles.rootNoteButton}
                label={note}
                selected={currentRootNote === note}
                onClick={() => {
                  onRootNoteChange(note);
                  onSelect();
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
