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
  showMidiNumbers,
  onShowMidiNumbersChange,
  layout,
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
        showMidiNumbers={showMidiNumbers}
        onShowMidiNumbersChange={onShowMidiNumbersChange}
        layout={layout}
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
  showMidiNumbers,
  onShowMidiNumbersChange,
  layout,
  onClone,
  onRemove,
}: Pick<
  KeyboardProps,
  | "children"
  | "audioPresetId"
  | "onAudioPresetIdChange"
  | "showHeader"
  | "showMidiNumbers"
  | "onShowMidiNumbersChange"
  | "layout"
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
          displayFormatId={presentation.activeDisplayFormatId}
          onDisplayFormatIdChange={presentation.setActiveDisplayFormatId}
          noteEmphasis={presentation.noteEmphasis}
          onNoteEmphasisChange={presentation.setNoteEmphasis}
          audioPresetId={audioPresetId}
          onAudioPresetIdChange={onAudioPresetIdChange}
          showMidiNumbers={showMidiNumbers}
          onShowMidiNumbersChange={onShowMidiNumbersChange}
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
