import { useEffect } from "react";
import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";
import { calculateFretboardGridColumns } from "@/utils/fretboard/calculateFretboardGridColumns";
import { getFretboardNotes } from "@/utils/fretboard/getFretboardNotes";
import { getNoteLabel } from "@/utils/fretboard/getNoteLabel";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import { getScaleActiveNotes } from "@/utils/fretboard/getScaleActiveNotes";
import { toggleFretboardNote } from "@/utils/fretboard/toggleFretboardNote";
import { type FretboardProps } from "@/types/fretboard/fretboard";
import FretboardNote from "./FretboardNote";

export default function FretboardNotesLayer({
  activeNotes,
  onActiveNotesChange,
  noteCollectionKey,
  rootNote,
  noteLabelType = "note-name",
}: FretboardProps) {
  const musicSystem = useMusicSystem();
  const config = useFretboardConfig();

  // Effective values: Prop > Context > Default
  const effectiveRootNote = rootNote ?? musicSystem?.rootNote ?? "C";
  const effectiveNoteCollectionKey =
    noteCollectionKey ?? musicSystem?.noteCollectionKey ?? "major";

  const tuning = config.tuning;
  const fretRange = config.fretRange;
  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    config.evenFrets,
  );

  const noteNames = getFretboardNotes({
    rootNote: effectiveRootNote,
    noteCollectionKey: effectiveNoteCollectionKey,
  });

  useEffect(() => {
    if (
      effectiveRootNote &&
      effectiveNoteCollectionKey &&
      onActiveNotesChange
    ) {
      const newActiveNotes = getScaleActiveNotes({
        rootNote: effectiveRootNote,
        noteCollectionKey: effectiveNoteCollectionKey,
        tuning,
        fretRange,
      });
      onActiveNotesChange(newActiveNotes);
    }
  }, [
    effectiveRootNote,
    effectiveNoteCollectionKey,
    tuning,
    fretRange,
    onActiveNotesChange,
  ]);

  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";
  const mainContentGridRow = isFretLabelsBottom ? "1 / 2" : "2 / -1";

  const fretLabelsGridRow = isFretLabelsBottom ? "2 / -1" : "1 / 2";

  return (
    <div
      style={{
        display: "grid",
        width: "100%",
        height: "100%",
        gridTemplateRows: isFretLabelsBottom
          ? "1fr max-content"
          : "max-content 1fr",
        gridTemplateColumns: fretboardGridColumns,
        pointerEvents: "none", // Let clicks pass through empty areas
      }}
    >
      {/* Spacer to Ensure Grid Alignment with Background (which has content in this row) */}
      <div
        style={{
          gridColumn: "1 / -1",
          gridRow: fretLabelsGridRow,
          height: config.fretLabelsHeight,
        }}
      />
      <div
        id="notes-container"
        style={{
          gridColumn: "1 / -1",
          gridRow: mainContentGridRow,
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridTemplateRows: `repeat(${tuning.length}, 1fr)`,
          pointerEvents: "auto", // Capture clicks on the notes grid
        }}
      >
        {tuning.map((openStringMidi, stringIndex) =>
          Array.from({ length: numFrets }).map((_, fretIndex) => {
            const fretNumber = startFret + fretIndex;
            const key = `${stringIndex}-${fretNumber}`;
            const note = activeNotes?.[key];

            const label = note
              ? getNoteLabel({
                  note,
                  labelType: noteLabelType,
                  noteNames,
                })
              : undefined;

            return (
              <div
                key={key}
                style={{
                  gridColumn: `${fretIndex + 1} / span 1`,
                  gridRow: `${stringIndex + 1} / span 1`,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                onPointerDown={() => {
                  // Prevent event bubbling if needed, or allow it.
                  // Since we have pointer-events: auto on the container, this is fine.
                  toggleFretboardNote({
                    stringIndex,
                    fretNumber,
                    openStringMidi,
                    activeNotes,
                    onActiveNotesChange,
                  });
                }}
              >
                {note && (
                  <FretboardNote note={note} label={label?.toString()} />
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
