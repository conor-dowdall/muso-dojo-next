export type KeyboardMidiRange = readonly [startMidi: number, endMidi: number];

export type KeyboardMidiRangeNoteNames = readonly [
  startNoteName: string,
  endNoteName: string,
];

export interface KeyboardRange {
  title: string;
  midiRange: KeyboardMidiRange;
  midiRangeNoteNames: KeyboardMidiRangeNoteNames;
}

export const keyboardRanges = {
  keys25: {
    title: "25 Key",
    midiRange: [48, 72],
    midiRangeNoteNames: ["C3", "C5"],
  },
  keys37: {
    title: "37 Key",
    midiRange: [36, 72],
    midiRangeNoteNames: ["C2", "C5"],
  },
  keys49: {
    title: "49 Key",
    midiRange: [36, 84],
    midiRangeNoteNames: ["C2", "C6"],
  },
  keys61: {
    title: "61 Key",
    midiRange: [36, 96],
    midiRangeNoteNames: ["C2", "C7"],
  },
  fullPiano: {
    title: "Full Piano",
    midiRange: [21, 108],
    midiRangeNoteNames: ["A0", "C8"],
  },
} as const satisfies Record<string, KeyboardRange>;

export type KeyboardRangeName = keyof typeof keyboardRanges;

export const DEFAULT_KEYBOARD_RANGE = "keys37" satisfies KeyboardRangeName;

export function normalizeKeyboardRangeName(
  value: unknown,
): KeyboardRangeName | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  if (value in keyboardRanges) {
    return value as KeyboardRangeName;
  }

  return undefined;
}
