import { type CSSProperties } from "react";
import { type FretboardProps } from "@/types/fretboard";
import {
  FretboardProvider,
  useFretboardGeometry,
  useFretboardPresentation,
} from "./FretboardContext";
import { InstrumentDisplayControls } from "@/components/instrument/InstrumentDisplayControls";
import { InstrumentHeaderActions } from "@/components/instrument/InstrumentHeaderActions";
import { InstrumentContainer } from "@/components/instrument/InstrumentContainer";
import { assetUrl } from "@/utils/assets/assetPath";
import { FretboardBackground } from "./FretboardBackground";
import styles from "./Fretboard.module.css";

export function Fretboard({
  children,
  showHeader,
  layout,
  onClone,
  onRemove,
  ...props
}: FretboardProps) {
  return (
    <FretboardProvider {...props}>
      <FretboardInner
        showHeader={showHeader}
        layout={layout}
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
  showHeader,
  layout,
  onClone,
  onRemove,
}: Pick<
  FretboardProps,
  "children" | "showHeader" | "layout" | "onClone" | "onRemove"
>) {
  const presentation = useFretboardPresentation();
  const geometry = useFretboardGeometry();

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
            "--wound-string-texture": assetUrl("/textures/wound-string.svg"),
          } as CSSProperties
        }
      >
        <FretboardBackground />
        {children}
      </div>
    </InstrumentContainer>
  );
}
