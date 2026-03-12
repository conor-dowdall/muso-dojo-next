import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import { useEffectiveMusicSystem } from "@/hooks/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/useActiveNotes";
import { getNoteLabel } from "@/utils/music/getNoteLabel";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import { getScaleActiveNotes } from "@/utils/fretboard/getScaleActiveNotes";
import { toggleFretboardNote } from "@/utils/fretboard/toggleFretboardNote";
import { type FretboardProps } from "@/types/fretboard/fretboard";
import FretboardNote from "./FretboardNote";

export default function FretboardNotesLayer({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
  noteCollectionKey,
  rootNote,
  noteLabelType = "note-name",
}: FretboardProps) {
  const config = useFretboardConfig();

  const { effectiveRootNote, effectiveNoteCollectionKey, noteNames } =
    useEffectiveMusicSystem({ rootNote, noteCollectionKey });

  const tuning = config.tuning;
  const fretRange = config.fretRange;
  const numFrets = getNumFrets(fretRange);
  const startFret = fretRange[0];

  const dependencies = `${effectiveRootNote}-${effectiveNoteCollectionKey}-${tuning.join()}-${fretRange.join()}`;

  const [activeNotes, onActiveNotesChange] = useActiveNotes(
    externalActiveNotes,
    externalOnChange,
    dependencies,
    () =>
      getScaleActiveNotes({
        rootNote: effectiveRootNote,
        noteCollectionKey: effectiveNoteCollectionKey,
        tuning,
        fretRange,
      }),
  );

  const isFretLabelsBottom = config.fretLabelsPosition === "bottom";
  const mainContentGridRow = isFretLabelsBottom ? "1 / 2" : "2 / -1";

  return (
    <div
      data-component="FretboardNotesLayer"
      style={{
        display: "grid",
        gridColumn: "1 / -1",
        gridRow: "1 / -1",
        gridTemplateRows: "subgrid",
        gridTemplateColumns: "subgrid",
      }}
    >
      {/* Notes Container */}
      <div
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
                  cursor: "pointer",
                }}
                onPointerDown={() => {
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
