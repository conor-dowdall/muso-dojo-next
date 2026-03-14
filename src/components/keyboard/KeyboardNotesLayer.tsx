import { useKeyboardConfig } from "@/context/keyboard/KeyboardContext";
import { useEffectiveMusicSystem } from "@/hooks/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/useActiveNotes";
import { getKeyboardActiveNotes } from "@/utils/keyboard/getKeyboardActiveNotes";
import { toggleKeyboardNote } from "@/utils/keyboard/toggleKeyboardNote";
import {
  isBlackKey,
  countWhiteKeys,
  getBlackKeyOffset,
} from "@/utils/keyboard/keyboardLayout";
import { type KeyboardProps } from "@/types/keyboard/keyboard";
import KeyboardNote from "./KeyboardNote";

export default function KeyboardNotesLayer({
  activeNotes: externalActiveNotes,
  onActiveNotesChange: externalOnChange,
  noteCollectionKey,
  rootNote,
  showMidiNumbers: externalShowMidiNumbers,
  noteEmphasis = "large",
}: KeyboardProps) {
  const config = useKeyboardConfig();

  const {
    effectiveRootNote,
    effectiveNoteCollectionKey,
    noteNames,
    showMidiNumbers: contextShowMidiNumbers,
  } = useEffectiveMusicSystem({ rootNote, noteCollectionKey });

  const effectiveShowMidiNumbers =
    externalShowMidiNumbers ?? contextShowMidiNumbers;

  const midiRange = config.midiRange;
  const [startMidi, endMidi] = midiRange;

  // Include noteEmphasis in dependencies so manual overrides are cleared
  // when the global mode changes (switching between Large, Small, Hidden).
  const dependencies = `${effectiveRootNote}-${effectiveNoteCollectionKey}-${midiRange.join()}-${noteEmphasis}`;

  const [activeNotes, onActiveNotesChange] = useActiveNotes(
    externalActiveNotes,
    externalOnChange,
    dependencies,
    () =>
      getKeyboardActiveNotes({
        rootNote: effectiveRootNote,
        noteCollectionKey: effectiveNoteCollectionKey,
        midiRange,
      }),
  );

  const numWhiteKeys = countWhiteKeys(startMidi, endMidi);
  const whiteKeyWidth = `${100 / numWhiteKeys}%`;
  const blackKeyWidth = `${(100 / numWhiteKeys) * config.blackKeyWidthRatio}%`;

  // Build key list with positions
  let whiteKeyIndex = 0;
  const keys: Array<{
    midi: number;
    isBlack: boolean;
    left: string;
    width: string;
  }> = [];

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const black = isBlackKey(midi);
    if (black) {
      // Black key: positioned relative to the current white key index
      const offset = getBlackKeyOffset(midi);
      const leftPercent =
        (whiteKeyIndex / numWhiteKeys) * 100 + (offset * 100) / numWhiteKeys;
      keys.push({
        midi,
        isBlack: true,
        left: `${leftPercent}%`,
        width: blackKeyWidth,
      });
    } else {
      keys.push({
        midi,
        isBlack: false,
        left: `${(whiteKeyIndex / numWhiteKeys) * 100}%`,
        width: whiteKeyWidth,
      });
      whiteKeyIndex++;
    }
  }

  return (
    <div
      data-component="KeyboardNotesLayer"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {keys.map(({ midi, isBlack: black, left, width }) => {
        const key = `${midi}`;
        const note = activeNotes?.[key];

        const label = note
          ? effectiveShowMidiNumbers
            ? String(note.midi)
            : noteNames?.[note.midi % 12]
          : undefined;

        // Note emphasis override ALWAYS wins over global state.
        const effectiveEmphasis = note?.emphasis ?? noteEmphasis;

        return (
          <div
            key={key}
            style={{
              position: "absolute",
              left,
              width,
              top: 0,
              height: black ? `${config.blackKeyHeightPercent}%` : "100%",
              zIndex: black ? 2 : 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onPointerDown={() => {
              toggleKeyboardNote({
                midi,
                activeNotes,
                onActiveNotesChange,
                globalEmphasis: noteEmphasis,
              });
            }}
          >
            {note && (
              <KeyboardNote
                note={{
                  ...note,
                  emphasis: effectiveEmphasis,
                }}
                label={label}
                isBlack={black}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
