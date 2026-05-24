"use client";

import {
  type InstrumentNoteInteractionMode,
  type InstrumentNoteInteractionModeSetter,
} from "@/types/instrument";
import { type AudioPresetId } from "@/audio/types";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
} from "@/data/displayFormats";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "@/types/instrument-note-emphasis";
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import { Copy, Eraser, Pencil, Volume2, X } from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { InstrumentSettingsButton } from "./InstrumentSettingsButton";
import styles from "./InstrumentHeaderActions.module.css";

interface InstrumentHeaderActionsProps {
  audioPresetId?: AudioPresetId;
  displayFormatId: DisplayFormatId;
  instrumentType: InstrumentType;
  noteEmphasis: InstrumentNoteEmphasis;
  noteInteractionMode: InstrumentNoteInteractionMode;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onDisplayFormatIdChange: DisplayFormatSetter;
  onNoteEmphasisChange: InstrumentNoteEmphasisSetter;
  setNoteInteractionMode: InstrumentNoteInteractionModeSetter;
  showMidiNumbers?: boolean;
  onShowMidiNumbersChange?: SettingSetter<boolean>;
  onResetNotes: () => void;
  isModified: boolean;
  onClone?: () => void;
  onRemove?: () => void;
}

const noteInteractionModeLabels = {
  play: "Play notes",
  "edit-note": "Edit notes",
} as const satisfies Record<InstrumentNoteInteractionMode, string>;

export const InstrumentHeaderActions = ({
  audioPresetId,
  displayFormatId,
  instrumentType,
  noteEmphasis,
  noteInteractionMode,
  onAudioPresetIdChange,
  onDisplayFormatIdChange,
  onNoteEmphasisChange,
  setNoteInteractionMode,
  showMidiNumbers,
  onShowMidiNumbersChange,
  onResetNotes,
  isModified,
  onClone,
  onRemove,
}: InstrumentHeaderActionsProps) => {
  const canResetNotes = noteInteractionMode === "edit-note" && isModified;
  const resetNotesLabel =
    noteInteractionMode === "play"
      ? `${noteInteractionModeLabels["edit-note"]} to reset custom edits`
      : isModified
        ? "Reset custom edits"
        : "No custom edits";

  return (
    <div className={styles.instrumentHeaderActions}>
      <span
        className={styles.noteInteractionModeGroup}
        role="group"
        aria-label="Note interaction mode"
      >
        <IconButton
          aria-label={noteInteractionModeLabels.play}
          icon={<Volume2 />}
          size="sm"
          onClick={() => setNoteInteractionMode("play")}
          selected={noteInteractionMode === "play"}
          tooltip={noteInteractionModeLabels.play}
          variant={noteInteractionMode === "play" ? "filled" : "outline"}
        />
        <IconButton
          aria-label={noteInteractionModeLabels["edit-note"]}
          icon={<Pencil />}
          size="sm"
          onClick={() => setNoteInteractionMode("edit-note")}
          selected={noteInteractionMode === "edit-note"}
          tooltip={noteInteractionModeLabels["edit-note"]}
          variant={noteInteractionMode === "edit-note" ? "filled" : "outline"}
        />
      </span>
      <IconButton
        aria-label={resetNotesLabel}
        icon={<Eraser />}
        size="sm"
        onClick={onResetNotes}
        disabled={!canResetNotes}
        tooltip={resetNotesLabel}
        variant={canResetNotes ? "filled" : "ghost"}
      />
      <InstrumentSettingsButton
        audioPresetId={audioPresetId}
        displayFormatId={displayFormatId}
        instrumentType={instrumentType}
        noteEmphasis={noteEmphasis}
        onAudioPresetIdChange={onAudioPresetIdChange}
        onDisplayFormatIdChange={onDisplayFormatIdChange}
        onNoteEmphasisChange={onNoteEmphasisChange}
        onShowMidiNumbersChange={onShowMidiNumbersChange}
        showMidiNumbers={showMidiNumbers}
      />
      {onClone ? (
        <IconButton
          aria-label="Duplicate instrument"
          icon={<Copy />}
          size="sm"
          onClick={onClone}
        />
      ) : null}
      {onRemove ? (
        <IconButton
          aria-label="Remove instrument"
          icon={<X />}
          size="sm"
          onClick={onRemove}
        />
      ) : null}
    </div>
  );
};
