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
  showTooltips?: boolean;
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
  showTooltips = true,
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
            tooltip={
              showTooltips
                ? canRemoveOctave
                  ? "Remove highest octave"
                  : "Keep at least one note"
                : false
            }
          />
        ) : null}
        <IconButton
          aria-label="Remove last note"
          disabled={!canRemoveNote}
          icon={<ListMinus />}
          size="sm"
          onClick={onRemoveNote}
          tooltip={
            showTooltips
              ? canRemoveNote
                ? "Remove last note"
                : "Keep at least one note"
              : false
          }
        />
      </span>
      <span className={styles.directionGroup}>
        <IconButton
          aria-label="Add next note"
          disabled={!canAddNote}
          icon={<ListPlus />}
          size="sm"
          onClick={onAddNote}
          tooltip={
            showTooltips
              ? canAddNote
                ? "Add next note"
                : "Highest playable note reached"
              : false
          }
        />
        {showOctaveActions ? (
          <IconButton
            aria-label="Add octave"
            disabled={!canAddOctave}
            icon={<LayersPlus />}
            size="sm"
            onClick={onAddOctave}
            tooltip={
              showTooltips
                ? canAddOctave
                  ? "Add octave"
                  : "No room for another octave"
                : false
            }
          />
        ) : null}
      </span>
    </span>
  );
}
