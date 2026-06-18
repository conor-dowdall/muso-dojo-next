import { LayersMinus, LayersPlus, ListMinus, ListPlus } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import styles from "./NoteRangeHeaderActions.module.css";

interface NoteRangeHeaderActionsProps {
  canAddNote: boolean;
  canAddOctave: boolean;
  canRemoveNote: boolean;
  canRemoveOctave: boolean;
  onAddNote: () => void;
  onAddOctave: () => void;
  onRemoveNote: () => void;
  onRemoveOctave: () => void;
  showOctaveActions?: boolean;
}

export function NoteRangeHeaderActions({
  canAddNote,
  canAddOctave,
  canRemoveNote,
  canRemoveOctave,
  onAddNote,
  onAddOctave,
  onRemoveNote,
  onRemoveOctave,
  showOctaveActions = true,
}: NoteRangeHeaderActionsProps) {
  return (
    <span
      className={styles.actions}
      role="group"
      aria-label="Visible note range"
    >
      <span className={styles.directionGroup}>
        {showOctaveActions ? (
          <IconButton
            aria-label="Remove highest octave"
            disabled={!canRemoveOctave}
            icon={<LayersMinus />}
            size="sm"
            onClick={onRemoveOctave}
          />
        ) : null}
        <IconButton
          aria-label="Remove last note"
          disabled={!canRemoveNote}
          icon={<ListMinus />}
          size="sm"
          onClick={onRemoveNote}
        />
      </span>
      <span className={styles.directionGroup}>
        <IconButton
          aria-label="Add next note"
          disabled={!canAddNote}
          icon={<ListPlus />}
          size="sm"
          onClick={onAddNote}
        />
        {showOctaveActions ? (
          <IconButton
            aria-label="Add octave"
            disabled={!canAddOctave}
            icon={<LayersPlus />}
            size="sm"
            onClick={onAddOctave}
          />
        ) : null}
      </span>
    </span>
  );
}
