"use client";

import { type ReactNode, useState } from "react";
import {
  type ActiveNotesLockSnapshot,
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
import {
  Circle,
  CircleDot,
  CircleOff,
  Eraser,
  Lock,
  Pencil,
  SquarePen,
  Volume2,
} from "lucide-react";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { DisplayFormatTriggerButton } from "@/components/music-theory/DisplayFormatTriggerButton";
import { ObjectMenuTriggerButton } from "@/components/ui/object-menu";
import {
  InstrumentMenuDialog,
  type InstrumentMenuChoice,
} from "./InstrumentMenuDialog";
import { resolveInstrumentNoteInteractionMode } from "@/utils/instrument/resolveInstrumentInteractionMode";
import styles from "./InstrumentHeaderActions.module.css";

interface InstrumentHeaderActionsProps {
  audioPresetId?: AudioPresetId;
  displayFormatId: DisplayFormatId;
  instrumentType: InstrumentType;
  noteEmphasis: InstrumentNoteEmphasis;
  noteInteractionMode: InstrumentNoteInteractionMode;
  activeNotesLocked?: boolean;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onActiveNotesLockChange?: (
    activeNotesLocked: boolean,
    activeNotesLockSnapshot?: ActiveNotesLockSnapshot,
    activeNotesSourceKey?: string,
  ) => void;
  onDisplayFormatIdChange: DisplayFormatSetter;
  onNoteEmphasisChange: InstrumentNoteEmphasisSetter;
  setNoteInteractionMode: InstrumentNoteInteractionModeSetter;
  getActiveNotesLockSnapshot: () => ActiveNotesLockSnapshot | null;
  getActiveNotesSourceKey: () => string | null;
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
  activeNotesLocked = false,
  onAudioPresetIdChange,
  onActiveNotesLockChange,
  onDisplayFormatIdChange,
  onNoteEmphasisChange,
  setNoteInteractionMode,
  getActiveNotesLockSnapshot,
  getActiveNotesSourceKey,
  onResetNotes,
  isModified,
  onClone,
  onRemove,
}: InstrumentHeaderActionsProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuDialogKey, setMenuDialogKey] = useState(0);
  const [menuChoice, setMenuChoice] = useState<InstrumentMenuChoice | null>(
    null,
  );
  const effectiveNoteInteractionMode = resolveInstrumentNoteInteractionMode({
    activeNotesLocked,
    noteInteractionMode,
  });
  const isEditingNotes = effectiveNoteInteractionMode !== "play";
  const canResetNotes = !activeNotesLocked && isEditingNotes && isModified;
  const resetNotesLabel = activeNotesLocked
    ? "Unlock to reset custom edits"
    : effectiveNoteInteractionMode === "play"
      ? `${noteInteractionModeLabels["edit-one"]} to reset custom edits`
      : isModified
        ? "Reset custom edits"
        : "No custom edits";
  const noteEmphasisLabel = noteEmphasisLabels[noteEmphasis];
  const activeNotesLockLabel = activeNotesLocked
    ? "Unlock notes"
    : "Lock current notes";

  const openMenu = (choice: InstrumentMenuChoice | null) => {
    setMenuChoice(choice);
    setMenuDialogKey((currentKey) => currentKey + 1);
    setIsMenuOpen(true);
  };

  const cycleDefaultNoteSize = () => {
    onNoteEmphasisChange((prev) => {
      if (prev === "large") return "small";
      if (prev === "small") return "hidden";
      return "large";
    });
  };

  const toggleActiveNotesLock = () => {
    if (!onActiveNotesLockChange) {
      return;
    }

    if (activeNotesLocked) {
      onActiveNotesLockChange(
        false,
        undefined,
        getActiveNotesSourceKey() ?? undefined,
      );
      return;
    }

    const activeNotesLockSnapshot = getActiveNotesLockSnapshot();

    if (!activeNotesLockSnapshot) {
      return;
    }

    setNoteInteractionMode("play");
    onActiveNotesLockChange(true, activeNotesLockSnapshot);
  };

  return (
    <div className={styles.instrumentHeaderActions}>
      <span
        className={styles.presentationControlsGroup}
        role="group"
        aria-label="Display controls"
      >
        <DisplayFormatTriggerButton
          className={styles.displayFormatButton}
          value={displayFormatId}
          onClick={() => openMenu("display")}
        />
        <IconButton
          aria-label={`Change default note size. Current: ${noteEmphasisLabel}`}
          disabled={activeNotesLocked}
          icon={getNoteEmphasisIcon(noteEmphasis)}
          size="sm"
          onClick={cycleDefaultNoteSize}
          tooltip={
            activeNotesLocked
              ? "Unlock to change default note size"
              : `Default note size: ${noteEmphasisLabel}`
          }
        />
      </span>

      <span
        className={styles.rightControlsGroup}
        role="group"
        aria-label="Instrument action controls"
      >
        <span
          className={styles.noteInteractionModeGroup}
          role="group"
          aria-label="Note interaction mode"
        >
          {noteInteractionModes.map((mode) => {
            const modeDisabled =
              activeNotesLocked === true && mode.id !== "play";

            return (
              <IconButton
                key={mode.id}
                aria-label={mode.ariaLabel}
                disabled={modeDisabled}
                icon={mode.icon}
                size="sm"
                onClick={() => setNoteInteractionMode(mode.id)}
                selected={effectiveNoteInteractionMode === mode.id}
                tooltip={modeDisabled ? "Unlock to edit notes" : mode.tooltip}
                variant={
                  effectiveNoteInteractionMode === mode.id
                    ? "filled"
                    : "outline"
                }
              />
            );
          })}
        </span>

        <span
          className={styles.noteEditActionsGroup}
          role="group"
          aria-label="Note edit actions"
        >
          <IconButton
            aria-label={activeNotesLockLabel}
            disabled={!onActiveNotesLockChange}
            icon={<Lock />}
            size="sm"
            onClick={toggleActiveNotesLock}
            selected={activeNotesLocked}
            tooltip={activeNotesLockLabel}
            variant={activeNotesLocked ? "filled" : "outline"}
          />
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

        <span
          className={styles.utilityControlsGroup}
          role="group"
          aria-label="Instrument utilities"
        >
          <ObjectMenuTriggerButton
            level="instrument"
            onClick={() => openMenu(null)}
          />
        </span>
      </span>

      <InstrumentMenuDialog
        key={menuDialogKey}
        audioPresetId={audioPresetId}
        displayFormatId={displayFormatId}
        initialOpenChoice={menuChoice}
        instrumentType={instrumentType}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onClone={onClone}
        onRemove={onRemove}
        onAudioPresetIdChange={onAudioPresetIdChange}
        onDisplayFormatIdChange={onDisplayFormatIdChange}
      />
    </div>
  );
};
