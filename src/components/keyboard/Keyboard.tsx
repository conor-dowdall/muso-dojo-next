import { type KeyboardProps } from "@/types/keyboard";
import {
  KeyboardProvider,
  useKeyboardGeometry,
  useKeyboardPresentation,
} from "./KeyboardContext";
import { InstrumentDisplayControls } from "@/components/instrument/InstrumentDisplayControls";
import { InstrumentHeaderActions } from "@/components/instrument/InstrumentHeaderActions";
import { InstrumentContainer } from "@/components/instrument/InstrumentContainer";
import { KeyboardBackground } from "./KeyboardBackground";
import styles from "./Keyboard.module.css";

export function Keyboard({
  children,
  showHeader,
  layout,
  onClone,
  onRemove,
  ...props
}: KeyboardProps) {
  return (
    <KeyboardProvider {...props}>
      <KeyboardInner
        showHeader={showHeader}
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
  showHeader,
  layout,
  onClone,
  onRemove,
}: Pick<
  KeyboardProps,
  "children" | "showHeader" | "layout" | "onClone" | "onRemove"
>) {
  const presentation = useKeyboardPresentation();
  const geometry = useKeyboardGeometry();

  return (
    <InstrumentContainer
      displayControls={
        <InstrumentDisplayControls
          displayFormatId={presentation.activeDisplayFormatId}
          onDisplayFormatIdChange={presentation.setActiveDisplayFormatId}
          noteEmphasis={presentation.noteEmphasis}
          onNoteEmphasisChange={presentation.setNoteEmphasis}
        />
      }
      headerActions={
        <InstrumentHeaderActions
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
