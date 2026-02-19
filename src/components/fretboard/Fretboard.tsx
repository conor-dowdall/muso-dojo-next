"use client";

import { useEffect } from "react";

import { calculateFretboardGridColumns } from "@/utils/fretboard/calculateFretboardGridColumns";

import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import Fret from "./Fret";
import FretLabel from "./FretLabel";
import InstrumentString from "./InstrumentString";
import FretboardNote from "./FretboardNote";
import { getNoteLabel } from "@/utils/fretboard/getNoteLabel";
import { type FretboardProps } from "@/types/fretboard/fretboard";
import {
  FretboardProvider,
  useFretboardConfig,
} from "@/context/fretboard/FretboardContext";
import {
  useMusicSystem,
  MusicSystemProvider,
} from "@/context/music-theory/MusicSystemContext";
import MusicToolbar from "../toolbar/MusicToolbar";
import { getFretboardNotes } from "@/utils/fretboard/getFretboardNotes";
import { toggleFretboardNote } from "@/utils/fretboard/toggleFretboardNote";
import { getScaleActiveNotes } from "@/utils/fretboard/getScaleActiveNotes";

export default function Fretboard(props: FretboardProps) {
  return (
    <FretboardProvider {...props}>
      <FretboardContent {...props} />
    </FretboardProvider>
  );
}

function FretboardContent(props: FretboardProps) {
  const { showToolbar, rootNote, noteCollectionKey } = props;
  const musicSystem = useMusicSystem();

  // Effective values: Prop > Context > Default
  const initialRootNote = rootNote ?? musicSystem?.rootNote ?? "C";
  const initialNoteCollectionKey =
    noteCollectionKey ?? musicSystem?.noteCollectionKey ?? "major";

  // If showing toolbar, we wrap in a local provider.
  // We need to render the content differently depending on whether we are initializing a local provider or just consuming.
  if (showToolbar) {
    return (
      <MusicSystemProvider
        initialRootNote={initialRootNote}
        initialNoteCollectionKey={initialNoteCollectionKey}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <MusicToolbar />
          <div style={{ flex: 1 }}>
            <FretboardInner
              {...props}
              // Pass null/undefined for these so the inner component uses the context we just created
              rootNote={undefined}
              noteCollectionKey={undefined}
            />
          </div>
        </div>
      </MusicSystemProvider>
    );
  }

  return <FretboardInner {...props} />;
}

function FretboardInner({
  activeNotes,
  onActiveNotesChange,
  noteCollectionKey,
  rootNote,
  noteLabelType = "note-name",
}: FretboardProps) {
  const musicSystem = useMusicSystem();

  // Effective values: Prop > Context > Default
  // Note: if wrapped in local provider by parent, musicSystem will be that local provider.
  // If not, it will be global or null.
  const effectiveRootNote = rootNote ?? musicSystem?.rootNote ?? "C";
  const effectiveNoteCollectionKey =
    noteCollectionKey ?? musicSystem?.noteCollectionKey ?? "major";

  const config = useFretboardConfig();
  const noteNames = getFretboardNotes({
    rootNote: effectiveRootNote,
    noteCollectionKey: effectiveNoteCollectionKey,
  });

  const tuning = config.tuning;
  const fretRange = config.fretRange;

  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];
  const fretboardGridColumns = calculateFretboardGridColumns(
    numFrets,
    config.evenFrets,
  );

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
                  toggleFretboardNote({
                    stringIndex,
                    fretNumber,
                    openStringMidi,
                    activeNotes,
                    onActiveNotesChange,
                  })
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
