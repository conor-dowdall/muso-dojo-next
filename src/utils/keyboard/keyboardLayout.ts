/**
 * Utility to determine if a MIDI note is a black key.
 */
export function isBlackKey(midi: number): boolean {
  const pc = midi % 12;
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
 * Calculates the CSS left offset for a black key relative to the white key area.
 * Each black key sits between two white keys, offset to the right by a fractional amount.
 *
 * The offsets are tuned to match a realistic piano layout where black keys
 * are not perfectly centered between their surrounding white keys.
 */
export function getBlackKeyOffset(midi: number): number {
  const pc = midi % 12;
  // These offsets are fractions of a white key width.
  // They represent how far right the *center* of the black key is
  // from the left edge of the corresponding white key space.
  switch (pc) {
    case 1:
      return -0.38; // C# — slightly left of center between C and D
    case 3:
      return -0.28; // D# — slightly right of center between D and E
    case 6:
      return -0.42; // F# — slightly left
    case 8:
      return -0.32; // G# — center-ish
    case 10:
      return -0.22; // A# — slightly right
    default:
      return -0.33;
  }
}
