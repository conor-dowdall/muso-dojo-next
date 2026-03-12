import { useKeyboardConfig } from "@/context/keyboard/KeyboardContext";
import { useEffectiveMusicSystem } from "@/hooks/useEffectiveMusicSystem";
import { useActiveNotes } from "@/hooks/useActiveNotes";
import { getNoteLabel } from "@/utils/music/getNoteLabel";
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
  noteLabelType = "note-name",
}: KeyboardProps) {
  const config = useKeyboardConfig();

  const { effectiveRootNote, effectiveNoteCollectionKey, noteNames } =
    useEffectiveMusicSystem({ rootNote, noteCollectionKey });

  const midiRange = config.midiRange;
  const [startMidi, endMidi] = midiRange;

  const dependencies = `${effectiveRootNote}-${effectiveNoteCollectionKey}-${midiRange.join()}`;

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
        (whiteKeyIndex / numWhiteKeys) * 100 +
        (offset * 100) / numWhiteKeys;
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
              position: "absolute",
              left,
              width,
              top: 0,
              height: black ? `${config.blackKeyHeightPercent}%` : "100%",
              zIndex: black ? 2 : 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: black ? "4%" : "3%",
              pointerEvents: "auto",
              cursor: "pointer",
            }}
            onPointerDown={() => {
              toggleKeyboardNote({
                midi,
                activeNotes,
                onActiveNotesChange,
              });
            }}
          >
            {note && (
              <KeyboardNote
                note={note}
                label={label?.toString()}
                isBlack={black}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
