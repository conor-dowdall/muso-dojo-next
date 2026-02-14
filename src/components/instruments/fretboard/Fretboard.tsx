"use client";

import { calculateFretboardGridColumns } from "@/utils/fretboard/calculateFretboardGridColumns";

import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import Fret from "./Fret";
import FretLabel from "./FretLabel";
import InstrumentString from "./InstrumentString";
import FretboardNote from "./FretboardNote";
import { getNoteLabel } from "@/utils/fretboard/getNoteLabel";
import { type FretboardProps } from "@/types/fretboard";
import {
  FretboardProvider,
  useFretboardConfig,
} from "@/context/FretboardContext";
import { getFretboardNotes } from "@/utils/fretboard/getFretboardNotes";
import { useNoteInteraction } from "@/hooks/fretboard/useNoteInteraction";

export default function Fretboard(props: FretboardProps) {
  return (
    <FretboardProvider {...props}>
      <FretboardContent {...props} />
    </FretboardProvider>
  );
}

function FretboardContent({
  activeNotes,
  onActiveNotesChange,
  noteCollectionKey,
  rootNote,
  noteLabelType = "midi", // Default to MIDI if not specified
}: FretboardProps) {
  const config = useFretboardConfig();
  const noteNames = getFretboardNotes({ rootNote, noteCollectionKey });
  const { handleNoteClick } = useNoteInteraction({
    activeNotes,
    onActiveNotesChange,
  });

  const tuning = config.tuning;
  const fretRange = config.fretRange;

  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    config.evenFrets,
  );

  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";
  const mainContentGridRow = isFretLabelsBottom ? "1 / 2" : "2 / -1";
  const fretLabelsGridRow = isFretLabelsBottom ? "2 / -1" : "1 / 2";

  return (
    <div
      id="fretboard-wrapper"
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        containerType: "inline-size",
        gridTemplateRows: isFretLabelsBottom
          ? "1fr max-content"
          : "max-content 1fr",
        gridTemplateColumns: fretboardGridColumns,
        direction: config.leftHanded ? "rtl" : "ltr",
      }}
    >
      <div
        id="fingerboard"
        style={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow: mainContentGridRow,
          background: config.background,
        }}
      >
        {Array.from({ length: numFrets }).map((_, fretIndex) => (
          <Fret key={fretIndex} fretNumber={startFret + fretIndex} />
        ))}
      </div>

      <div
        id="strings-container"
        style={{
          gridColumn: "1 / -1",
          gridRow: mainContentGridRow,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {tuning.map((_: number, stringIndex: number) => (
          <InstrumentString key={stringIndex} stringNumber={stringIndex + 1} />
        ))}
      </div>

      <div
        id="notes-container"
        style={{
          gridColumn: "1 / -1",
          gridRow: mainContentGridRow,
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridTemplateRows: `repeat(${tuning.length}, 1fr)`,
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
                }}
                onPointerDown={() =>
                  handleNoteClick(stringIndex, fretNumber, openStringMidi)
                }
              >
                {note && (
                  <FretboardNote note={note} label={label?.toString()} />
                )}
              </div>
            );
          }),
        )}
      </div>

      <div
        id="fret-labels"
        style={{
          display: "grid",
          height: config.fretLabelsHeight,
          background: config.fretLabelsBackground,
          gridTemplateColumns: "subgrid",
          gridColumn: "1 / -1",
          gridRow: fretLabelsGridRow,
        }}
      >
        {Array.from({ length: numFrets }).map((_, i) => (
          <FretLabel key={i} fretNumber={startFret + i} />
        ))}
      </div>
    </div>
  );
}
