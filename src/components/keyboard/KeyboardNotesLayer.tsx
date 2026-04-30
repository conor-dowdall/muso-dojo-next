import {
  useKeyboardGeometry,
  useKeyboardPresentation,
} from "./KeyboardContext";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { type InstrumentNotesLayerProps } from "@/types/instrument";
import { type InstrumentNoteCellWrapperProps } from "@/types/instrument-note-cell";
import { useInstrumentNotes } from "@/hooks/instrument/useInstrumentNotes";
import { getKeyboardActiveNotes } from "@/utils/keyboard/getKeyboardActiveNotes";
import { useKeyboardNavigation } from "@/hooks/keyboard/useKeyboardNavigation";
import { type KeyboardNoteCellInfo } from "@/types/keyboard";
import styles from "./Keyboard.module.css";

type KeyboardNoteCellWrapperProps =
  InstrumentNoteCellWrapperProps<KeyboardNoteCellInfo>;

function KeyboardNoteCellWrapper({
  noteCell,
  note,
  label,
  ariaLabel,
  isFocused,
  setItemRef,
  handleKeyDown,
  interactItem,
}: KeyboardNoteCellWrapperProps) {
  const { key, midi, labelLarge, style } = noteCell;

  return (
    <InstrumentNoteCell
      noteKey={key}
      note={note}
      midi={midi}
      label={label}
      ariaLabel={ariaLabel}
      isFocused={isFocused}
      setItemRef={setItemRef}
      handleKeyDown={handleKeyDown}
      onInteraction={interactItem}
      className={styles.keyWrapper}
      style={style}
      largeSize={labelLarge}
    />
  );
}

export function KeyboardNotesLayer({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
  rootNote,
  noteCollectionKey,
  showMidiNumbers: externalShowMidiNumbers,
}: InstrumentNotesLayerProps) {
  const geometry = useKeyboardGeometry();
  const presentation = useKeyboardPresentation();
  const { interactiveMidiRange, noteCells } = geometry;

  const { activeNotes, noteLabels, handleToggle, getAriaLabel } =
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
      dependencies: [interactiveMidiRange.join()],
      getInitialActiveNotes: ({ rootNote, noteCollectionKey }) =>
        getKeyboardActiveNotes({
          rootNote,
          noteCollectionKey,
          midiRange: interactiveMidiRange,
        }),
    });

  const { focusedKey, setItemRef, handleKeyDown, interactItem } =
    useKeyboardNavigation<HTMLElement>({
      midiRange: interactiveMidiRange,
      onToggle: handleToggle,
    });

  const noteCellElements = noteCells.map((noteCell) => {
    return (
      <KeyboardNoteCellWrapper
        key={noteCell.key}
        noteCell={noteCell}
        note={activeNotes?.[noteCell.key]}
        label={noteLabels[noteCell.midi]}
        ariaLabel={getAriaLabel(
          {
            type: "keyboard",
            isBlack: noteCell.isBlack,
            midi: noteCell.midi,
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

  return <div className={styles.notesLayer}>{noteCellElements}</div>;
}
