"use client";

import { type InstrumentNoteEmphasis } from "@/types/instrument-note-emphasis";
import { Circle, CircleDot, CircleOff, Copy, Eraser, X } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import styles from "./InstrumentHeaderActions.module.css";

interface InstrumentHeaderActionsProps {
  noteEmphasis: InstrumentNoteEmphasis;
  setNoteEmphasis: (
    emphasis:
      | InstrumentNoteEmphasis
      | ((prev: InstrumentNoteEmphasis) => InstrumentNoteEmphasis),
  ) => void;
  onResetNotes: () => void;
  isModified: boolean;
  onClone?: () => void;
  onRemove?: () => void;
}

export const InstrumentHeaderActions = ({
  noteEmphasis,
  setNoteEmphasis,
  onResetNotes,
  isModified,
  onClone,
  onRemove,
}: InstrumentHeaderActionsProps) => {
  const noteEmphasisLabel =
    noteEmphasis.charAt(0).toUpperCase() + noteEmphasis.slice(1);

  const toggleNoteEmphasis = () => {
    setNoteEmphasis((prev) => {
      if (prev === "large") return "small";
      if (prev === "small") return "hidden";
      return "large";
    });
  };

  return (
    <div className={styles.instrumentHeaderActions}>
      <IconButton
        aria-label={`Change note size. Current: ${noteEmphasisLabel}`}
        icon={
          <>
            {noteEmphasis === "large" && <Circle />}
            {noteEmphasis === "small" && <CircleDot />}
            {noteEmphasis === "hidden" && <CircleOff />}
          </>
        }
        size="sm"
        onClick={toggleNoteEmphasis}
        tooltip={`Note size: ${noteEmphasisLabel}`}
      />
      <IconButton
        aria-label="Reset note changes"
        icon={<Eraser />}
        size="sm"
        onClick={onResetNotes}
        disabled={!isModified}
        variant={isModified ? "filled" : "ghost"}
      />
      {onClone ? (
        <IconButton
          aria-label="Duplicate instrument"
          icon={<Copy />}
          size="sm"
          variant="outline"
          onClick={onClone}
        />
      ) : null}
      {onRemove ? (
        <IconButton
          aria-label="Remove instrument"
          icon={<X />}
          size="sm"
          variant="outline"
          onClick={onRemove}
        />
      ) : null}
    </div>
  );
};
