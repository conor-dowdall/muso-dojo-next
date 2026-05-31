import { type KeyboardProps } from "@/types/keyboard";
import {
  KeyboardProvider,
  useKeyboardGeometry,
  useKeyboardPresentation,
} from "./KeyboardContext";
import { InstrumentHeaderActions } from "@/components/instrument/InstrumentHeaderActions";
import { InstrumentContainer } from "@/components/instrument/InstrumentContainer";
import { KeyboardBackground } from "./KeyboardBackground";
import styles from "./Keyboard.module.css";

export function Keyboard({
  children,
  audioPresetId,
  onAudioPresetIdChange,
  showHeader,
  layout,
  onInstrumentDisplaySizeChange,
  activeNotesLocked,
  onActiveNotesLockChange,
  onClone,
  onRemove,
  ...props
}: KeyboardProps) {
  return (
    <KeyboardProvider {...props}>
      <KeyboardInner
        audioPresetId={audioPresetId}
        onAudioPresetIdChange={onAudioPresetIdChange}
        showHeader={showHeader}
        layout={layout}
        onInstrumentDisplaySizeChange={onInstrumentDisplaySizeChange}
        activeNotesLocked={activeNotesLocked}
        onActiveNotesLockChange={onActiveNotesLockChange}
        onClone={onClone}
        onRemove={onRemove}
      >
        {children}
      </KeyboardInner>
    </KeyboardProvider>
  );
}

function KeyboardInner({
  children,
  audioPresetId,
  onAudioPresetIdChange,
  showHeader,
  layout,
  onInstrumentDisplaySizeChange,
  activeNotesLocked,
  onActiveNotesLockChange,
  onClone,
  onRemove,
}: Pick<
  KeyboardProps,
  | "children"
  | "audioPresetId"
  | "onAudioPresetIdChange"
  | "showHeader"
  | "layout"
  | "onInstrumentDisplaySizeChange"
  | "activeNotesLocked"
  | "onActiveNotesLockChange"
  | "onClone"
  | "onRemove"
>) {
  const presentation = useKeyboardPresentation();
  const geometry = useKeyboardGeometry();

  return (
    <InstrumentContainer
      headerActions={
        <InstrumentHeaderActions
          instrumentType="keyboard"
          layout={layout}
          displayFormatId={presentation.activeDisplayFormatId}
          onDisplayFormatIdChange={presentation.setActiveDisplayFormatId}
          noteEmphasis={presentation.noteEmphasis}
          onNoteEmphasisChange={presentation.setNoteEmphasis}
          audioPresetId={audioPresetId}
          onAudioPresetIdChange={onAudioPresetIdChange}
          onInstrumentDisplaySizeChange={onInstrumentDisplaySizeChange}
          activeNotesLocked={activeNotesLocked}
          onActiveNotesLockChange={onActiveNotesLockChange}
          getActiveNotesLockSnapshot={presentation.getActiveNotesLockSnapshot}
          getActiveNotesSourceKey={presentation.getActiveNotesSourceKey}
          noteInteractionMode={presentation.noteInteractionMode}
          setNoteInteractionMode={presentation.setNoteInteractionMode}
          onResetNotes={presentation.resetNotes}
          isModified={presentation.isModified}
          onClone={onClone}
          onRemove={onRemove}
        />
      }
      showHeader={showHeader}
      noteEmphasis={presentation.noteEmphasis}
      sizing={geometry.sizing}
      layout={layout}
    >
      <div data-instrument="keyboard" className={styles.keyboardInner}>
        <KeyboardBackground />
        {children}
      </div>
    </InstrumentContainer>
  );
}
