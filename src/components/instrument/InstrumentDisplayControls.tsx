"use client";

import { Circle, CircleDot, CircleOff } from "lucide-react";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "@/types/instrument-note-emphasis";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { DisplayFormatButton } from "@/components/music-theory/DisplayFormatButton";
import styles from "./InstrumentDisplayControls.module.css";

interface InstrumentDisplayControlsProps {
  displayFormatId: DisplayFormatId;
  onDisplayFormatIdChange: DisplayFormatSetter;
  noteEmphasis: InstrumentNoteEmphasis;
  onNoteEmphasisChange: InstrumentNoteEmphasisSetter;
}

export function InstrumentDisplayControls({
  displayFormatId,
  onDisplayFormatIdChange,
  noteEmphasis,
  onNoteEmphasisChange,
}: InstrumentDisplayControlsProps) {
  const noteEmphasisLabel =
    noteEmphasis.charAt(0).toUpperCase() + noteEmphasis.slice(1);

  const cycleDefaultNoteSize = () => {
    onNoteEmphasisChange((prev) => {
      if (prev === "large") return "small";
      if (prev === "small") return "hidden";
      return "large";
    });
  };

  return (
    <div className={styles.instrumentDisplayControls}>
      <DisplayFormatButton
        value={displayFormatId}
        onChange={onDisplayFormatIdChange}
      />
      <IconButton
        aria-label={`Change default note size. Current: ${noteEmphasisLabel}`}
        icon={
          <>
            {noteEmphasis === "large" && <Circle />}
            {noteEmphasis === "small" && <CircleDot />}
            {noteEmphasis === "hidden" && <CircleOff />}
          </>
        }
        size="sm"
        onClick={cycleDefaultNoteSize}
        tooltip={`Default note size: ${noteEmphasisLabel}`}
      />
    </div>
  );
}
