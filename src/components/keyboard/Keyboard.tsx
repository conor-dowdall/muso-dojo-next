import { type KeyboardProps } from "@/types/keyboard";
import {
  KeyboardProvider,
  useKeyboardGeometry,
  useKeyboardPresentation,
} from "./KeyboardContext";
import { InstrumentHeaderActions } from "@/components/instrument/InstrumentHeaderActions";
import { DisplayFormatButton } from "@/components/instrument/DisplayFormatButton";
import { InstrumentContainer } from "@/components/instrument/InstrumentContainer";
import { KeyboardBackground } from "./KeyboardBackground";
import { KeyboardNotesLayer } from "./KeyboardNotesLayer";
import styles from "./Keyboard.module.css";

function KeyboardHeaderActions({
  onClone,
  onRemove,
}: Pick<KeyboardProps, "onClone" | "onRemove">) {
  const presentation = useKeyboardPresentation();
  return (
    <InstrumentHeaderActions
      noteEmphasis={presentation.noteEmphasis}
      setNoteEmphasis={presentation.setNoteEmphasis}
      onResetNotes={presentation.resetNotes}
      isModified={presentation.isModified}
      onClone={onClone}
      onRemove={onRemove}
    />
  );
}

function KeyboardDisplayFormatButton() {
  const presentation = useKeyboardPresentation();
  return (
    <DisplayFormatButton
      activeDisplayFormatId={presentation.activeDisplayFormatId}
      setActiveDisplayFormatId={presentation.setActiveDisplayFormatId}
    />
  );
}

export function Keyboard({
  activeNotes,
  onActiveNotesChange,
  rootNote,
  noteCollectionKey,
  showMidiNumbers,
  showHeader,
  layout,
  onClone,
  onRemove,
  ...props
}: KeyboardProps) {
  return (
    <KeyboardProvider {...props}>
      <KeyboardInner
        activeNotes={activeNotes}
        onActiveNotesChange={onActiveNotesChange}
        rootNote={rootNote}
        noteCollectionKey={noteCollectionKey}
        showMidiNumbers={showMidiNumbers}
        showHeader={showHeader}
        layout={layout}
        onClone={onClone}
        onRemove={onRemove}
      />
    </KeyboardProvider>
  );
}

function KeyboardInner({
  activeNotes,
  onActiveNotesChange,
  rootNote,
  noteCollectionKey,
  showMidiNumbers,
  showHeader,
  layout,
  onClone,
  onRemove,
}: Pick<
  KeyboardProps,
  | "activeNotes"
  | "onActiveNotesChange"
  | "rootNote"
  | "noteCollectionKey"
  | "showMidiNumbers"
  | "showHeader"
  | "layout"
  | "onClone"
  | "onRemove"
>) {
  const { noteEmphasis } = useKeyboardPresentation();
  const geometry = useKeyboardGeometry();

  return (
    <InstrumentContainer
      displayFormatButton={<KeyboardDisplayFormatButton />}
      headerActions={
        <KeyboardHeaderActions onClone={onClone} onRemove={onRemove} />
      }
      showHeader={showHeader}
      noteEmphasis={noteEmphasis}
      sizing={geometry.sizing}
      layout={layout}
    >
      <div data-instrument="keyboard" className={styles.keyboardInner}>
        <KeyboardBackground />
        <KeyboardNotesLayer
          activeNotes={activeNotes}
          onActiveNotesChange={onActiveNotesChange}
          rootNote={rootNote}
          noteCollectionKey={noteCollectionKey}
          showMidiNumbers={showMidiNumbers}
        />
      </div>
    </InstrumentContainer>
  );
}
