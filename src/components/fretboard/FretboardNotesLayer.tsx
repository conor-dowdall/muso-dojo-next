import { useFretboardConfig } from "@/context/fretboard/FretboardContext";
import { useEffectiveMusicSystem } from "@/hooks/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/useActiveNotes";
import { getNumFrets } from "@/utils/fretboard/getNumFrets";
import { getScaleActiveNotes } from "@/utils/fretboard/getScaleActiveNotes";
import { toggleFretboardNote } from "@/utils/fretboard/toggleFretboardNote";
import { type FretboardProps } from "@/types/fretboard/fretboard";
import FretboardNote from "./FretboardNote";
import styles from "./Fretboard.module.css";

export default function FretboardNotesLayer({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
  noteCollectionKey,
  rootNote,
  showMidiNumbers: externalShowMidiNumbers,
}: FretboardProps) {
  const config = useFretboardConfig();

  const {
    effectiveRootNote,
    effectiveNoteCollectionKey,
    noteNames,
    showMidiNumbers: contextShowMidiNumbers,
  } = useEffectiveMusicSystem({ rootNote, noteCollectionKey });

  const effectiveShowMidiNumbers =
    externalShowMidiNumbers ?? contextShowMidiNumbers;

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
    <div data-component="FretboardNotesLayer" className={styles.subgridOverlay}>
      {/* Notes Container */}
      <div
        className={styles.notesContainer}
        style={
          {
            gridRow: mainContentGridRow,
            gridTemplateRows: `repeat(${tuning.length}, 1fr)`,
          } as React.CSSProperties
        }
      >
        {tuning.map((openStringMidi, stringIndex) =>
          Array.from({ length: numFrets }).map((_, fretIndex) => {
            const fretNumber = startFret + fretIndex;
            const key = `${stringIndex}-${fretNumber}`;
            const note = activeNotes?.[key];

            const label = note
              ? effectiveShowMidiNumbers
                ? String(note.midi)
                : noteNames?.[note.midi % 12]
              : undefined;

            return (
              <div
                key={key}
                className={styles.noteCell}
                style={
                  {
                    gridColumn: `${fretIndex + 1} / span 1`,
                    gridRow: `${stringIndex + 1} / span 1`,
                  } as React.CSSProperties
                }
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
                {note && <FretboardNote note={note} label={label} />}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
