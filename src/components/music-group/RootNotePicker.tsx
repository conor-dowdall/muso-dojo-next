import { useMusicGroup } from "./MusicGroupContext";
import { RootNoteGrid } from "./RootNoteGrid";

interface RootNotePickerProps {
  onSelect: () => void;
}

export function RootNotePicker({ onSelect }: RootNotePickerProps) {
  const { rootNote: currentRootNote, setRootNote: onRootNoteChange } =
    useMusicGroup();

  return (
    <RootNoteGrid
      value={currentRootNote}
      onChange={(rootNote) => {
        onRootNoteChange(rootNote);
        onSelect();
      }}
    />
  );
}
