import { type CSSProperties } from "react";
import {
  clampKeyLeftPercent,
  countWhiteKeys,
  getBlackKeyOffset,
  getInteractiveMidiRange,
  isBlackKey,
} from "@/utils/keyboard/keyboardGeometry";
import {
  type KeyboardGeometry,
  type KeyboardNoteCellInfo,
  type ResolvedKeyboardConfig,
} from "@/types/keyboard";
import { type InstrumentIntrinsicSizing } from "@/types/instrument-layout";

const KEYBOARD_SIZING = {
  whiteKeyWidth: 42,
  minWhiteKeyWidth: 28,
  preferredHeight: 144,
  minHeight: 96,
  maxHeight: 220,
};

function createKeyboardSizing(numWhiteKeys: number): InstrumentIntrinsicSizing {
  return {
    preferredWidth: numWhiteKeys * KEYBOARD_SIZING.whiteKeyWidth,
    preferredHeight: KEYBOARD_SIZING.preferredHeight,
    minReadableWidth: numWhiteKeys * KEYBOARD_SIZING.minWhiteKeyWidth,
    minHeight: KEYBOARD_SIZING.minHeight,
    maxHeight: KEYBOARD_SIZING.maxHeight,
  };
}

export function createKeyboardGeometry(
  config: ResolvedKeyboardConfig,
): KeyboardGeometry {
  const {
    midiRange,
    extendEdgeBlackKeys,
    blackKeyWidthRatio,
    blackKeyHeightPercent,
  } = config;
  const interactiveMidiRange = getInteractiveMidiRange(
    midiRange,
    extendEdgeBlackKeys,
  );
  const [startMidi, endMidi] = interactiveMidiRange;

  const numWhiteKeys = countWhiteKeys(startMidi, endMidi);
  const whiteKeyWidth = 100 / numWhiteKeys;
  const blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio;
  const sizing = createKeyboardSizing(numWhiteKeys);

  const whiteKeys: KeyboardNoteCellInfo[] = [];
  const blackKeys: KeyboardNoteCellInfo[] = [];
  const noteCells: KeyboardNoteCellInfo[] = [];

  let whiteKeyIndex = 0;

  const createBlackNoteCell = (
    midi: number,
    precedingWhiteKeys: number,
    clampToKeyboard: boolean,
  ): KeyboardNoteCellInfo => {
    const offset = getBlackKeyOffset(midi);
    const rawLeftPercent =
      (precedingWhiteKeys / numWhiteKeys) * 100 + (offset * 100) / numWhiteKeys;
    const leftPercent = clampToKeyboard
      ? clampKeyLeftPercent(rawLeftPercent, blackKeyWidth)
      : rawLeftPercent;

    return {
      key: String(midi),
      midi,
      isBlack: true,
      left: `${leftPercent}%`,
      width: `${blackKeyWidth}%`,
      height: `${blackKeyHeightPercent}%`,
      style: {
        "--left": `${leftPercent}%`,
        "--width": `${blackKeyWidth}%`,
        "--height": `${blackKeyHeightPercent}%`,
        zIndex: 2,
      } as CSSProperties,
      labelLarge: `min(100cqi, 72cqb)`,
      labelSmall: `min(65cqi, 48cqb)`,
    };
  };

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const isBlack = isBlackKey(midi);
    if (isBlack) {
      const isEdgeKey = midi === startMidi || midi === endMidi;
      const noteCell = createBlackNoteCell(midi, whiteKeyIndex, !isEdgeKey);
      blackKeys.push(noteCell);
      noteCells.push(noteCell);
    } else {
      const noteCell: KeyboardNoteCellInfo = {
        key: String(midi),
        midi,
        isBlack: false,
        left: `${(whiteKeyIndex / numWhiteKeys) * 100}%`,
        width: `${whiteKeyWidth}%`,
        height: "100%",
        style: {
          "--left": `${(whiteKeyIndex / numWhiteKeys) * 100}%`,
          "--width": `${whiteKeyWidth}%`,
          "--height": "100%",
          zIndex: 1,
        } as CSSProperties,
        labelLarge: `min(80cqi, 72cqb)`,
        labelSmall: `min(50cqi, 48cqb)`,
      };
      whiteKeys.push(noteCell);
      noteCells.push(noteCell);
      whiteKeyIndex++;
    }
  }

  return {
    ...config,
    interactiveMidiRange,
    whiteKeys,
    blackKeys,
    noteCells,
    whiteKeyWidth: `${whiteKeyWidth}%`,
    blackKeyWidth: `${blackKeyWidth}%`,
    sizing,
  };
}
