"use client";

import styles from "./DisplayFormatPicker.module.css";
import { OptionButton } from "@/components/ui/buttons/OptionButton";
import { useOptionalMusicPart } from "@/components/music-part/MusicPartContext";
import {
  displayFormatOptions,
  getDisplayFormatUnavailableReason,
  type DisplayFormatId,
} from "@/data/displayFormats";
import { type NoteCollectionKey } from "@musodojo/music-theory-data";

interface DisplayFormatPickerProps {
  noteCollectionKey?: NoteCollectionKey;
  rootNote?: string;
  value?: DisplayFormatId;
  onChange: (id: DisplayFormatId) => void;
}

export function DisplayFormatPicker({
  noteCollectionKey,
  rootNote,
  value,
  onChange,
}: DisplayFormatPickerProps) {
  const musicPart = useOptionalMusicPart();
  const effectiveRootNote = rootNote ?? musicPart?.rootNote ?? "C";
  const effectiveNoteCollectionKey =
    noteCollectionKey ?? musicPart?.noteCollectionKey ?? "major";

  return (
    <div className={styles.buttonGrid}>
      {displayFormatOptions.map((displayFormat) => {
        const unavailableReason = getDisplayFormatUnavailableReason(
          displayFormat.id,
          effectiveRootNote,
          effectiveNoteCollectionKey,
        );

        return (
          <OptionButton
            key={displayFormat.id}
            density="compact"
            disabled={unavailableReason !== undefined}
            label={displayFormat.shortLabel}
            presentation="tile"
            selected={value === displayFormat.id}
            subtitle={unavailableReason ?? displayFormat.example}
            onClick={() => onChange(displayFormat.id)}
          />
        );
      })}
    </div>
  );
}
