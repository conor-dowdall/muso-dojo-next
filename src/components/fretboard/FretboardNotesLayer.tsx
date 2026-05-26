import { type CSSProperties } from "react";
import {
  useFretboardGeometry,
  useFretboardPresentation,
} from "./FretboardContext";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { type InstrumentNotesLayerProps } from "@/types/instrument";
import { useInstrumentNotes } from "@/hooks/instrument/useInstrumentNotes";
import { getFretboardActiveNotes } from "@/utils/fretboard/getFretboardActiveNotes";
import { resolveInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";
import { createInstrumentNoteInteractionTarget } from "@/utils/instrument/createInstrumentNoteInteractionTarget";
import { useFretboardNavigation } from "@/hooks/fretboard/useFretboardNavigation";
import styles from "./Fretboard.module.css";

export function FretboardNotesLayer({
  activeNotes: externalActiveNotes,
  activeNotesLocked = false,
  activeNotesLockPreservesEdits,
  audioPresetId: externalAudioPresetId,
  onActiveNotesChange: externalOnChange,
  rootNote,
  noteCollectionKey,
}: InstrumentNotesLayerProps) {
  const geometry = useFretboardGeometry();
  const presentation = useFretboardPresentation();
  const { tuning, mainContentGridRow, fretRange, noteCells, leftHanded } =
    geometry;
  const noteTargets = noteCells.map((noteCell) =>
    createInstrumentNoteInteractionTarget(noteCell.key, noteCell.midi),
  );
  const previewAudioPresetId = resolveInstrumentAudioPresetId(
    "fretboard",
    externalAudioPresetId,
  );

  const {
    activeNotes,
    noteLabels,
    noteInteractionMode,
    handleInteract,
    getAriaLabel,
    getNoteColor,
  } = useInstrumentNotes({
    activeNotes: externalActiveNotes,
    onActiveNotesChange: externalOnChange,
    rootNote,
    noteCollectionKey,
    activeDisplayFormatId: presentation.activeDisplayFormatId,
    activeNotesLocked,
    activeNotesLockPreservesEdits,
    noteInteractionMode: presentation.noteInteractionMode,
    noteTargets,
    previewAudioPresetId,
    previewDurationSeconds: 0.72,
    noteEmphasis: presentation.noteEmphasis,
    emphasisResetKey: presentation.emphasisResetKey,
    setIsModified: presentation.setIsModified,
    setActiveNotesLockSnapshot: presentation.setActiveNotesLockSnapshot,
    dependencies: [tuning.join(), fretRange.join()],
    getInitialActiveNotes: ({ rootNote, noteCollectionKey }) =>
      getFretboardActiveNotes({
        rootNote,
        noteCollectionKey,
        tuning,
        fretRange,
      }),
  });

  const { focusedKey, setItemRef, handleKeyDown, handleItemInteraction } =
    useFretboardNavigation<HTMLElement>({
      tuning,
      fretRange,
      leftHanded,
      onInteract: handleInteract,
    });
  const isToggleButton = noteInteractionMode !== "play";

  const noteCellElements = noteCells.map((noteCell) => {
    return (
      <InstrumentNoteCell
        key={noteCell.key}
        noteKey={noteCell.key}
        note={activeNotes?.[noteCell.key]}
        noteColor={getNoteColor(noteCell.midi)}
        midi={noteCell.midi}
        label={noteLabels[noteCell.midi]}
        ariaLabel={getAriaLabel(
          {
            type: "fretboard",
            stringIndex: noteCell.stringIndex,
            fretNumber: noteCell.fretNumber,
          },
          noteCell.midi,
        )}
        isFocused={focusedKey === noteCell.key}
        setItemRef={setItemRef}
        handleKeyDown={handleKeyDown}
        onInteract={handleItemInteraction}
        isToggleButton={isToggleButton}
        style={noteCell.style}
        largeSize="80%"
      />
    );
  });

  return (
    <div className={styles.subgridOverlay}>
      <div
        className={styles.notesLayerWrapper}
        style={
          {
            "--notes-row": mainContentGridRow,
            "--notes-grid-rows": `repeat(${tuning.length}, 1fr)`,
          } as CSSProperties
        }
      >
        {noteCellElements}
      </div>
    </div>
  );
}
