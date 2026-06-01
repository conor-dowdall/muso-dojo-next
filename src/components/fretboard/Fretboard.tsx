import { type CSSProperties } from "react";
import { type FretboardProps } from "@/types/fretboard";
import {
  FretboardProvider,
  useFretboardGeometry,
  useFretboardPresentation,
} from "./FretboardContext";
import { InstrumentHeaderActions } from "@/components/instrument/InstrumentHeaderActions";
import { InstrumentContainer } from "@/components/instrument/InstrumentContainer";
import { FretboardBackground } from "./FretboardBackground";
import styles from "./Fretboard.module.css";

export function Fretboard({
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
}: FretboardProps) {
  return (
    <FretboardProvider {...props}>
      <FretboardInner
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
      </FretboardInner>
    </FretboardProvider>
  );
}

function FretboardInner({
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
  FretboardProps,
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
  const presentation = useFretboardPresentation();
  const geometry = useFretboardGeometry();

  return (
    <InstrumentContainer
      headerActions={
        <InstrumentHeaderActions
          instrumentType="fretboard"
          layout={layout}
          displayFormatId={presentation.activeDisplayFormatId}
          onDisplayFormatIdChange={presentation.setActiveDisplayFormatId}
          noteEmphasis={presentation.noteEmphasis}
          onNoteEmphasisChange={presentation.setNoteEmphasis}
          audioPresetId={audioPresetId}
          audioPresetContext={{ fretboardInstrument: geometry.instrument }}
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
      bodyClassName={styles.fretboardBody}
    >
      <div
        data-instrument="fretboard"
        className={styles.fretboardInner}
        style={
          {
            "--inner-grid-rows": geometry.showFretLabels
              ? geometry.isFretLabelsBottom
                ? "1fr max-content"
                : "max-content 1fr"
              : "1fr",
            "--inner-grid-columns": geometry.fretboardGridColumns,
            "--inner-direction": geometry.leftHanded ? "rtl" : "ltr",
            "--strings-count": geometry.stringIndices.length,
            "--frets-count": geometry.fretNumbers.length,
            "--wound-string-texture": 'url("/textures/wound-string.svg")',
          } as CSSProperties
        }
      >
        <FretboardBackground />
        {children}
      </div>
    </InstrumentContainer>
  );
}
