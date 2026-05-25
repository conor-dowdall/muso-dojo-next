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
import { resolveInstrumentAudioPresetId } from "@/utils/instrument/resolveInstrumentAudioPreset";
import { createInstrumentNoteInteractionTarget } from "@/utils/instrument/createInstrumentNoteInteractionTarget";
import { type KeyboardNoteCellInfo } from "@/types/keyboard";
import styles from "./Keyboard.module.css";

type KeyboardNoteCellWrapperProps =
  InstrumentNoteCellWrapperProps<KeyboardNoteCellInfo>;

function KeyboardNoteCellWrapper({
  noteCell,
  note,
  noteColor,
  label,
  ariaLabel,
  isFocused,
  isToggleButton,
  setItemRef,
  handleKeyDown,
  onInteract,
}: KeyboardNoteCellWrapperProps) {
  const { key, midi, labelLarge, style } = noteCell;

  return (
    <InstrumentNoteCell
      noteKey={key}
      note={note}
      noteColor={noteColor}
      midi={midi}
      label={label}
      ariaLabel={ariaLabel}
      isFocused={isFocused}
      setItemRef={setItemRef}
      handleKeyDown={handleKeyDown}
      isToggleButton={isToggleButton}
      notePlacement="bottom"
      onInteract={onInteract}
      className={styles.keyWrapper}
      style={style}
      largeSize={labelLarge}
    />
  );
}

export function KeyboardNotesLayer({
  activeNotes: externalActiveNotes,
  activeNotesLocked = false,
  audioPresetId: externalAudioPresetId,
  onActiveNotesChange: externalOnChange,
  rootNote,
  noteCollectionKey,
}: InstrumentNotesLayerProps) {
  const geometry = useKeyboardGeometry();
  const presentation = useKeyboardPresentation();
  const { interactiveMidiRange, noteCells } = geometry;
  const noteTargets = noteCells.map((noteCell) =>
    createInstrumentNoteInteractionTarget(noteCell.key, noteCell.midi),
  );
  const previewAudioPresetId = resolveInstrumentAudioPresetId(
    "keyboard",
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
    noteInteractionMode: presentation.noteInteractionMode,
    noteTargets,
    previewAudioPresetId,
    noteEmphasis: presentation.noteEmphasis,
    emphasisResetKey: presentation.emphasisResetKey,
    setIsModified: presentation.setIsModified,
    setActiveNotesLockSnapshot: presentation.setActiveNotesLockSnapshot,
    dependencies: [interactiveMidiRange.join()],
    getInitialActiveNotes: ({ rootNote, noteCollectionKey }) =>
      getKeyboardActiveNotes({
        rootNote,
        noteCollectionKey,
        midiRange: interactiveMidiRange,
      }),
  });

  const { focusedKey, setItemRef, handleKeyDown, handleItemInteraction } =
    useKeyboardNavigation<HTMLElement>({
      midiRange: interactiveMidiRange,
      onInteract: handleInteract,
    });
  const isToggleButton = noteInteractionMode !== "play";

  const noteCellElements = noteCells.map((noteCell) => {
    return (
      <KeyboardNoteCellWrapper
        key={noteCell.key}
        noteCell={noteCell}
        note={activeNotes?.[noteCell.key]}
        noteColor={getNoteColor(noteCell.midi)}
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
        isToggleButton={isToggleButton}
        setItemRef={setItemRef}
        handleKeyDown={handleKeyDown}
        onInteract={handleItemInteraction}
      />
    );
  });

  return <div className={styles.notesLayer}>{noteCellElements}</div>;
}
