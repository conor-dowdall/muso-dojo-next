import { type CSSProperties } from "react";
import { type FretboardProps } from "@/types/fretboard";
import {
  FretboardProvider,
  useFretboardGeometry,
  useFretboardPresentation,
} from "./FretboardContext";
import { InstrumentHeaderActions } from "@/components/instrument/InstrumentHeaderActions";
import { DisplayFormatButton } from "@/components/instrument/DisplayFormatButton";
import { InstrumentContainer } from "@/components/instrument/InstrumentContainer";
import { assetUrl } from "@/utils/assets/assetPath";
import { FretboardBackground } from "./FretboardBackground";
import { FretboardNotesLayer } from "./FretboardNotesLayer";
import styles from "./Fretboard.module.css";

function FretboardHeaderActions({
  onClone,
  onRemove,
}: Pick<FretboardProps, "onClone" | "onRemove">) {
  const presentation = useFretboardPresentation();
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

function FretboardDisplayFormatButton() {
  const presentation = useFretboardPresentation();
  return (
    <DisplayFormatButton
      activeDisplayFormatId={presentation.activeDisplayFormatId}
      setActiveDisplayFormatId={presentation.setActiveDisplayFormatId}
    />
  );
}

export function Fretboard({
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
}: FretboardProps) {
  return (
    <FretboardProvider {...props}>
      <FretboardInner
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
    </FretboardProvider>
  );
}

function FretboardInner({
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
  FretboardProps,
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
  const { noteEmphasis } = useFretboardPresentation();
  const geometry = useFretboardGeometry();

  return (
    <InstrumentContainer
      displayFormatButton={<FretboardDisplayFormatButton />}
      headerActions={
        <FretboardHeaderActions onClone={onClone} onRemove={onRemove} />
      }
      showHeader={showHeader}
      noteEmphasis={noteEmphasis}
      sizing={geometry.sizing}
      layout={layout}
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
            "--wound-string-texture": assetUrl("/textures/wound-string.svg"),
          } as CSSProperties
        }
      >
        <FretboardBackground />
        <FretboardNotesLayer
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
