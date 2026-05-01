import { type CSSProperties } from "react";
import {
  useFretboardGeometry,
  useFretboardPresentation,
} from "./FretboardContext";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { type InstrumentNotesLayerProps } from "@/types/instrument";
import { type InstrumentNoteCellWrapperProps } from "@/types/instrument-note-cell";
import { useInstrumentNotes } from "@/hooks/instrument/useInstrumentNotes";
import { getFretboardActiveNotes } from "@/utils/fretboard/getFretboardActiveNotes";
import { type FretboardNoteCellInfo } from "@/types/fretboard";
import { useFretboardNavigation } from "@/hooks/fretboard/useFretboardNavigation";
import styles from "./Fretboard.module.css";

type FretboardNoteCellWrapperProps =
  InstrumentNoteCellWrapperProps<FretboardNoteCellInfo>;

function FretboardNoteCellWrapper({
  noteCell,
  note,
  noteColor,
  label,
  ariaLabel,
  isFocused,
  setItemRef,
  handleKeyDown,
  interactItem,
}: FretboardNoteCellWrapperProps) {
  return (
    <InstrumentNoteCell
      noteKey={noteCell.key}
      note={note}
      noteColor={noteColor}
      midi={noteCell.midi}
      label={label}
      ariaLabel={ariaLabel}
      isFocused={isFocused}
      setItemRef={setItemRef}
      handleKeyDown={handleKeyDown}
      onInteraction={interactItem}
      style={noteCell.style}
      largeSize="80%"
    />
  );
}

export function FretboardNotesLayer({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
  rootNote,
  noteCollectionKey,
  showMidiNumbers: externalShowMidiNumbers,
}: InstrumentNotesLayerProps) {
  const geometry = useFretboardGeometry();
  const presentation = useFretboardPresentation();
  const { tuning, mainContentGridRow, fretRange, noteCells, leftHanded } =
    geometry;

  const { activeNotes, noteLabels, handleToggle, getAriaLabel, getNoteColor } =
    useInstrumentNotes({
      activeNotes: externalActiveNotes,
      onActiveNotesChange: externalOnChange,
      rootNote,
      noteCollectionKey,
      showMidiNumbers: externalShowMidiNumbers,
      activeDisplayFormatId: presentation.activeDisplayFormatId,
      noteEmphasis: presentation.noteEmphasis,
      emphasisResetKey: presentation.emphasisResetKey,
      setIsModified: presentation.setIsModified,
      dependencies: [tuning.join(), fretRange.join()],
      getInitialActiveNotes: ({ rootNote, noteCollectionKey }) =>
        getFretboardActiveNotes({
          rootNote,
          noteCollectionKey,
          tuning,
          fretRange,
        }),
    });

  const { focusedKey, setItemRef, handleKeyDown, interactItem } =
    useFretboardNavigation<HTMLElement>({
      tuning,
      fretRange,
      leftHanded,
      onToggle: handleToggle,
    });

  const noteCellElements = noteCells.map((noteCell) => {
    return (
      <FretboardNoteCellWrapper
        key={noteCell.key}
        noteCell={noteCell}
        note={activeNotes?.[noteCell.key]}
        noteColor={getNoteColor(noteCell.midi)}
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
        interactItem={interactItem}
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
