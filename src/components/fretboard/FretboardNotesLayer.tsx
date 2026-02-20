import { useState } from "react";
import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import { useMusicSystem } from "@/context/music-theory/MusicSystemContext";
import { getFretboardNotes } from "@/utils/fretboard/getFretboardNotes";
import { getNoteLabel } from "@/utils/fretboard/getNoteLabel";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import { getScaleActiveNotes } from "@/utils/fretboard/getScaleActiveNotes";
import { toggleFretboardNote } from "@/utils/fretboard/toggleFretboardNote";
import {
  type FretboardProps,
  type ActiveNotes,
} from "@/types/fretboard/fretboard";
import FretboardNote from "./FretboardNote";

export default function FretboardNotesLayer({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
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

  const noteNames = getFretboardNotes({
    rootNote: effectiveRootNote,
    noteCollectionKey: effectiveNoteCollectionKey,
  });

  // State Management: Smart Uncontrolled Pattern
  // If the parent provides `activeNotes`, we are controlled. Otherwise, we manage our own state.
  const isControlled = externalActiveNotes !== undefined;
  const [internalActiveNotes, setInternalActiveNotes] = useState<ActiveNotes>(
    {},
  );

  // Track dependencies to derive state whenever rootNote, scale, or tuning changes.
  // This avoids `useEffect` double-renders by updating state directly during the render phase.
  const [prevDependencies, setPrevDependencies] = useState("");
  const currentDependencies = `${effectiveRootNote}-${effectiveNoteCollectionKey}-${tuning.join()}-${fretRange.join()}`;

  if (currentDependencies !== prevDependencies) {
    setPrevDependencies(currentDependencies);

    // Only auto-calculate notes if we are managing our own state.
    // If we are controlled, it's the parent's responsibility to provide the correct notes!
    if (!isControlled) {
      const newNotes = getScaleActiveNotes({
        rootNote: effectiveRootNote,
        noteCollectionKey: effectiveNoteCollectionKey,
        tuning,
        fretRange,
      });
      setInternalActiveNotes(newNotes);
    }
  }

  // Determine which state to use for rendering and updating
  const activeNotes = isControlled ? externalActiveNotes : internalActiveNotes;
  const onActiveNotesChange = isControlled
    ? externalOnChange
    : setInternalActiveNotes;

  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";
  const mainContentGridRow = isFretLabelsBottom ? "1 / 2" : "2 / -1";

  return (
    <div
      style={{
        display: "grid",
        gridColumn: "1 / -1",
        gridRow: "1 / -1",
        gridTemplateRows: "subgrid",
        gridTemplateColumns: "subgrid",
        pointerEvents: "none", // Let clicks pass through empty areas
      }}
    >
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
