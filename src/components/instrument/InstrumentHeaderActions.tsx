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
import {
  type InstrumentLayoutConfig,
  type InstrumentSize,
} from "@/types/instrument-layout";
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
import {
  ControlHeaderCluster,
  ControlHeaderLayout,
} from "@/components/ui/control-header/ControlHeader";
import { DisplayFormatTriggerButton } from "@/components/music-theory/DisplayFormatTriggerButton";
import { OverflowMenuButton } from "@/components/ui/object-menu";
import {
  type FretboardAppearanceSettings,
  type FretboardTuningSettings,
  InstrumentMenuDialog,
  type InstrumentMenuChoice,
  type KeyboardAppearanceSettings,
} from "./InstrumentMenuDialog";
import { createInstrumentLayoutConfig } from "@/utils/instrument/createInstrumentLayoutConfig";
import { type InstrumentAudioPresetContext } from "@/utils/instrument/resolveInstrumentAudioPreset";
import { resolveInstrumentNoteInteractionMode } from "@/utils/instrument/resolveInstrumentInteractionMode";
import styles from "./InstrumentHeaderActions.module.css";

interface InstrumentHeaderActionsProps {
  audioPresetId?: AudioPresetId;
  audioPresetContext?: InstrumentAudioPresetContext;
  displayFormatId: DisplayFormatId;
  fretboardAppearance?: FretboardAppearanceSettings;
  fretboardTuning?: FretboardTuningSettings;
  instrumentType: InstrumentType;
  keyboardAppearance?: KeyboardAppearanceSettings;
  identity?: ReactNode;
  layout?: InstrumentLayoutConfig;
  noteEmphasis: InstrumentNoteEmphasis;
  noteInteractionMode: InstrumentNoteInteractionMode;
  activeNotesLocked?: boolean;
  onAudioPresetIdChange?: SettingSetter<AudioPresetId>;
  onInstrumentDisplaySizeChange?: SettingSetter<InstrumentSize>;
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
  },
  {
    id: "edit-one",
    label: "Edit",
    ariaLabel: noteInteractionModeLabels["edit-one"],
    icon: <Pencil />,
  },
  {
    id: "edit-pitch-class",
    label: "Edit All",
    ariaLabel: noteInteractionModeLabels["edit-pitch-class"],
    icon: <SquarePen />,
  },
] as const satisfies readonly {
  ariaLabel: string;
  icon: ReactNode;
  id: InstrumentNoteInteractionMode;
  label: string;
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
  audioPresetContext,
  displayFormatId,
  fretboardAppearance,
  fretboardTuning,
  instrumentType,
  keyboardAppearance,
  identity,
  layout,
  noteEmphasis,
  noteInteractionMode,
  activeNotesLocked = false,
  onAudioPresetIdChange,
  onInstrumentDisplaySizeChange,
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
  const instrumentSize = createInstrumentLayoutConfig(layout).size;
  const activeNotesLockLabel = activeNotesLocked
    ? "Unlock notes"
    : "Lock current notes";

  const openMenu = (choice: InstrumentMenuChoice | null) => {
    setMenuChoice(choice);
    setMenuDialogKey((currentKey) => currentKey + 1);
    setIsMenuOpen(true);
  };

  const cycleNoteSize = () => {
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
    <>
      <ControlHeaderLayout
        leading={identity}
        trailing={
          <>
            <ControlHeaderCluster aria-label="Display controls" role="group">
              <DisplayFormatTriggerButton
                className={styles.displayFormatButton}
                value={displayFormatId}
                onClick={() => openMenu("display")}
              />
              <IconButton
                aria-label={`Change note size. Current: ${noteEmphasisLabel}`}
                disabled={activeNotesLocked}
                icon={getNoteEmphasisIcon(noteEmphasis)}
                size="sm"
                onClick={cycleNoteSize}
              />
            </ControlHeaderCluster>

            <ControlHeaderCluster
              aria-label="Note interaction mode"
              role="group"
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
                  />
                );
              })}
            </ControlHeaderCluster>

            <ControlHeaderCluster aria-label="Note edit actions" role="group">
              <IconButton
                aria-label={activeNotesLockLabel}
                disabled={!onActiveNotesLockChange}
                icon={<Lock />}
                size="sm"
                onClick={toggleActiveNotesLock}
                selected={activeNotesLocked}
              />
              <IconButton
                aria-label={resetNotesLabel}
                icon={<Eraser />}
                size="sm"
                onClick={onResetNotes}
                disabled={!canResetNotes}
              />
            </ControlHeaderCluster>

            <ControlHeaderCluster
              aria-label="Instrument utilities"
              role="group"
            >
              <OverflowMenuButton
                aria-label="Instrument options"
                onClick={() => openMenu(null)}
              />
            </ControlHeaderCluster>
          </>
        }
      />
      <InstrumentMenuDialog
        key={menuDialogKey}
        audioPresetId={audioPresetId}
        audioPresetContext={audioPresetContext}
        displayFormatId={displayFormatId}
        fretboardAppearance={fretboardAppearance}
        fretboardTuning={fretboardTuning}
        initialOpenChoice={menuChoice}
        instrumentSize={instrumentSize}
        instrumentType={instrumentType}
        keyboardAppearance={keyboardAppearance}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onClone={onClone}
        onRemove={onRemove}
        onAudioPresetIdChange={onAudioPresetIdChange}
        onDisplayFormatIdChange={onDisplayFormatIdChange}
        onInstrumentDisplaySizeChange={onInstrumentDisplaySizeChange}
      />
    </>
  );
};
