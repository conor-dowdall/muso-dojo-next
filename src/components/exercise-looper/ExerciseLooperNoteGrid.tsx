import { type CSSProperties, type KeyboardEvent } from "react";
import { InstrumentNote } from "@/components/instrument/InstrumentNote";
import { InstrumentNoteCell } from "@/components/instrument/InstrumentNoteCell";
import { InstrumentNoteTileLabel } from "@/components/instrument/InstrumentNoteTileLabel";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { type NoteColorMode } from "@/types/note-colors";
import {
  type ExercisePatternMode,
  type ExerciseSequence,
} from "@/utils/exercise-looper/exerciseSequence";
import { formatSpelledMidiNote } from "@/utils/music-theory/midiNote";
import { resolveInstrumentNoteColor } from "@/utils/note-colors/resolveNoteColors";
import styles from "./ExerciseLooperModule.module.css";

export function ExerciseLooperNoteGrid({
  activeCollectionPositions,
  auditionActiveKeys,
  focusedKey,
  handleItemInteraction,
  handleKeyDown,
  mode,
  noteColorMode,
  rootNote,
  sequence,
  setItemRef,
}: {
  activeCollectionPositions: ReadonlySet<number>;
  auditionActiveKeys: ReadonlySet<string>;
  focusedKey: string;
  handleItemInteraction: (target: InstrumentNoteInteractionTarget) => void;
  handleKeyDown: (event: KeyboardEvent, key: string) => void;
  mode: ExercisePatternMode;
  noteColorMode: NoteColorMode;
  rootNote: string;
  sequence: ExerciseSequence;
  setItemRef: (key: string, element: HTMLElement | null) => void;
}) {
  return (
    <div className={styles.noteStack}>
      <div
        className={styles.noteRows}
        style={
          {
            "--looper-column-count": sequence.columnCount,
          } as CSSProperties
        }
      >
        {sequence.displayRows.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.noteRow}>
            {row.map((note) => {
              const noteColor = resolveInstrumentNoteColor({
                midi: note.midi,
                mode: noteColorMode,
                rootNote,
              });
              const chordDescriptor =
                mode === "extension"
                  ? sequence.chordDescriptorsByAnchorPosition.get(
                      note.collectionPosition,
                    )
                  : undefined;
              const noteLabel = formatSpelledMidiNote(note.label, note.midi);
              const ariaLabel = chordDescriptor
                ? `Audition ${chordDescriptor.chordName}, intervals ${chordDescriptor.intervals.join(", ")}, from ${noteLabel}, interval ${note.intervalLabel}`
                : `Audition ${noteLabel}, interval ${note.intervalLabel}`;
              const isHighlighted =
                auditionActiveKeys.has(note.key) ||
                activeCollectionPositions.has(note.collectionPosition);
              const label = (
                <InstrumentNoteTileLabel
                  primary={noteLabel}
                  secondary={note.intervalLabel}
                />
              );

              if (!note.isAnchor) {
                return (
                  <div
                    key={note.key}
                    aria-hidden="true"
                    className={`${styles.noteButton} ${styles.generatedNoteIndicator}`}
                    data-note-highlighted={isHighlighted ? true : undefined}
                    style={{ gridColumn: note.columnIndex + 1 }}
                  >
                    <InstrumentNote
                      className={styles.generatedNote}
                      largeSize="100%"
                      note={{ emphasis: "large", midi: note.midi }}
                      noteColor={noteColor}
                      surface="embedded"
                    >
                      {label}
                    </InstrumentNote>
                  </div>
                );
              }

              return (
                <InstrumentNoteCell
                  key={note.key}
                  ariaLabel={ariaLabel}
                  className={styles.noteButton}
                  handleKeyDown={handleKeyDown}
                  isFocused={focusedKey === note.key}
                  isHighlighted={isHighlighted}
                  largeSize="100%"
                  midi={note.midi}
                  note={{ emphasis: "large", midi: note.midi }}
                  noteColor={noteColor}
                  noteKey={note.key}
                  onInteract={handleItemInteraction}
                  setItemRef={setItemRef}
                  style={{ gridColumn: note.columnIndex + 1 }}
                  surface="raised"
                >
                  {label}
                </InstrumentNoteCell>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
