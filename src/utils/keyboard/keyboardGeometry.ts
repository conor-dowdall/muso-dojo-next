export const MIDI_MIN = 0;
export const MIDI_MAX = 127;

/**
 * Utility to determine if a MIDI note is a black key.
 */
export function isBlackKey(midi: number): boolean {
  const pc = ((midi % 12) + 12) % 12;
  // C#=1, D#=3, F#=6, G#=8, A#=10
  return pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;
}

/**
 * Returns the number of white keys in a MIDI range (inclusive).
 */
export function countWhiteKeys(startMidi: number, endMidi: number): number {
  let count = 0;
  for (let midi = startMidi; midi <= endMidi; midi++) {
    if (!isBlackKey(midi)) count++;
  }
  return count;
}

/**
 * Keeps an absolutely positioned key fully inside the keyboard.
 * This matters for partial ranges that start or end on a black key.
 */
export function clampKeyLeftPercent(
  leftPercent: number,
  keyWidthPercent: number,
): number {
  const maxLeft = Math.max(0, 100 - keyWidthPercent);
  return Math.min(maxLeft, Math.max(0, leftPercent));
}

/**
 * Expands a core range by one black key at either edge when doing so makes
 * the visible keyboard feel complete. The expanded keys are real keys:
 * rendered, labelled, focusable, clickable, and included in active notes.
 */
export function getInteractiveMidiRange(
  midiRange: readonly [number, number],
  extendEdgeBlackKeys: boolean,
): [number, number] {
  if (!extendEdgeBlackKeys) {
    return [...midiRange];
  }

  const [startMidi, endMidi] = midiRange;
  const leadingMidi = startMidi - 1;
  const trailingMidi = endMidi + 1;

  return [
    leadingMidi >= MIDI_MIN && !isBlackKey(startMidi) && isBlackKey(leadingMidi)
      ? leadingMidi
      : startMidi,
    trailingMidi <= MIDI_MAX && !isBlackKey(endMidi) && isBlackKey(trailingMidi)
      ? trailingMidi
      : endMidi,
  ];
}

/**
 * Calculates the CSS left offset for a black key relative to the white key area.
 * Each black key sits between two white keys, offset to the right by a fractional amount.
 *
 * The offsets are tuned to match a realistic piano layout where black keys
 * are not perfectly centered between their surrounding white keys.
 */
export function getBlackKeyOffset(midi: number): number {
  const pc = ((midi % 12) + 12) % 12;
  // These offsets are fractions of a white key width.
  // They represent how far right the *center* of the black key is
  // from the left edge of the corresponding white key space.
  switch (pc) {
    case 1:
      return -0.38; // D♭ - slightly left of center between C and D
    case 3:
      return -0.28; // E♭ - slightly right of center between D and E
    case 6:
      return -0.42; // G♭ - slightly left of center between F and G
    case 8:
      return -0.32; // A♭ - center-ish of center between G and A
    case 10:
      return -0.22; // B♭ - slightly right of center between A and B
    default:
      return -0.33;
  }
}
