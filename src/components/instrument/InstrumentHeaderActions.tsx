"use client";

import { type ReactNode, useState } from "react";
import {
  type InstrumentNoteInteractionMode,
  type InstrumentNoteInteractionModeSetter,
} from "@/types/instrument";
import { type AudioPresetId } from "@/audio/types";
import {
  type DisplayFormatId,
  type DisplayFormatSetter,
  getDisplayFormatLabel,
} from "@/data/displayFormats";
import {
  type InstrumentNoteEmphasis,
  type InstrumentNoteEmphasisSetter,
} from "@/types/instrument-note-emphasis";
import { type InstrumentType } from "@/types/session";
import { type SettingSetter } from "@/types/state";
import {
  Circle,
  CircleDot,
  CircleOff,
  Eraser,
  Pencil,
  Settings,
  SquarePen,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  InstrumentSettingsDialog,
  type InstrumentSettingsChoice,
} from "./InstrumentSettingsDialog";
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
  onResetNotes: () => void;
  isModified: boolean;
  onClone?: () => void;
  onRemove?: () => void;
}

const noteInteractionModeLabels = {
  play: "Play notes",
  "edit-one": "Edit notes",
  "edit-pitch-class": "Edit all matching notes",
} as const satisfies Record<InstrumentNoteInteractionMode, string>;

const noteInteractionModes = [
  {
    id: "play",
    label: "Play",
    ariaLabel: noteInteractionModeLabels.play,
    icon: <Volume2 />,
    tooltip: noteInteractionModeLabels.play,
  },
  {
    id: "edit-one",
    label: "Edit",
    ariaLabel: noteInteractionModeLabels["edit-one"],
    icon: <Pencil />,
    tooltip: noteInteractionModeLabels["edit-one"],
  },
  {
    id: "edit-pitch-class",
    label: "Edit All",
    ariaLabel: noteInteractionModeLabels["edit-pitch-class"],
    icon: <SquarePen />,
    tooltip: noteInteractionModeLabels["edit-pitch-class"],
  },
] as const satisfies readonly {
  ariaLabel: string;
  icon: ReactNode;
  id: InstrumentNoteInteractionMode;
  label: string;
  tooltip: string;
}[];

const noteEmphasisLabels = {
  large: "Large",
  small: "Small",
  hidden: "Hidden",
} as const satisfies Record<InstrumentNoteEmphasis, string>;

function getNoteEmphasisIcon(noteEmphasis: InstrumentNoteEmphasis) {
  switch (noteEmphasis) {
    case "large":
      return <Circle />;
    case "small":
      return <CircleDot />;
    case "hidden":
      return <CircleOff />;
  }
}

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
  onResetNotes,
  isModified,
  onClone,
  onRemove,
}: InstrumentHeaderActionsProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDialogKey, setSettingsDialogKey] = useState(0);
  const [settingsChoice, setSettingsChoice] =
    useState<InstrumentSettingsChoice | null>(null);
  const isEditingNotes = noteInteractionMode !== "play";
  const canResetNotes = isEditingNotes && isModified;
  const resetNotesLabel =
    noteInteractionMode === "play"
      ? `${noteInteractionModeLabels["edit-one"]} to reset custom edits`
      : isModified
        ? "Reset custom edits"
        : "No custom edits";
  const displayFormatLabel = getDisplayFormatLabel(displayFormatId);
  const noteEmphasisLabel = noteEmphasisLabels[noteEmphasis];

  const openSettings = (choice: InstrumentSettingsChoice | null) => {
    setSettingsChoice(choice);
    setSettingsDialogKey((currentKey) => currentKey + 1);
    setIsSettingsOpen(true);
  };

  const cycleDefaultNoteSize = () => {
    onNoteEmphasisChange((prev) => {
      if (prev === "large") return "small";
      if (prev === "small") return "hidden";
      return "large";
    });
  };

  return (
    <div className={styles.instrumentHeaderActions}>
      <span
        className={styles.presentationControlsGroup}
        role="group"
        aria-label="Display controls"
      >
        <Tooltip text={`Display: ${displayFormatLabel}`} describeChild={false}>
          <Button
            aria-label={`Change display format. Current: ${displayFormatLabel}`}
            className={styles.displayFormatButton}
            density="compact"
            label={displayFormatLabel}
            size="sm"
            onClick={() => openSettings("display")}
          />
        </Tooltip>
        <IconButton
          aria-label={`Change default note size. Current: ${noteEmphasisLabel}`}
          icon={getNoteEmphasisIcon(noteEmphasis)}
          size="sm"
          onClick={cycleDefaultNoteSize}
          tooltip={`Default note size: ${noteEmphasisLabel}`}
        />
      </span>

      <span className={styles.rightControlsGroup}>
        <span
          className={styles.interactionControlsGroup}
          role="group"
          aria-label="Note interaction controls"
        >
          <span
            className={styles.noteInteractionModeGroup}
            role="group"
            aria-label="Note interaction mode"
          >
            {noteInteractionModes.map((mode) => (
              <IconButton
                key={mode.id}
                aria-label={mode.ariaLabel}
                icon={mode.icon}
                size="sm"
                onClick={() => setNoteInteractionMode(mode.id)}
                selected={noteInteractionMode === mode.id}
                tooltip={mode.tooltip}
                variant={noteInteractionMode === mode.id ? "filled" : "outline"}
              />
            ))}
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
        </span>

        <span className={styles.utilityControlsGroup}>
          <IconButton
            aria-label="Instrument settings"
            icon={<Settings />}
            size="sm"
            tooltip="Instrument settings"
            onClick={() => openSettings(null)}
          />
        </span>
      </span>

      <InstrumentSettingsDialog
        key={settingsDialogKey}
        audioPresetId={audioPresetId}
        displayFormatId={displayFormatId}
        initialOpenChoice={settingsChoice}
        instrumentType={instrumentType}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClone={onClone}
        onRemove={onRemove}
        onAudioPresetIdChange={onAudioPresetIdChange}
        onDisplayFormatIdChange={onDisplayFormatIdChange}
      />
    </div>
  );
};
