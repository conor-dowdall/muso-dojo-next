export const DEFAULT_CONCERT_PITCH_HZ = 440;
export const MIDI_A4 = 69;
export const MIDI_MIN = 0;
export const MIDI_MAX = 127;

export function midiToFrequency(
  midiNote: number,
  concertPitchHz = DEFAULT_CONCERT_PITCH_HZ,
) {
  const referenceFrequency =
    Number.isFinite(concertPitchHz) && concertPitchHz > 0
      ? concertPitchHz
      : DEFAULT_CONCERT_PITCH_HZ;

  return referenceFrequency * 2 ** ((midiNote - MIDI_A4) / 12);
}

export function isPlayableMidiNote(midiNote: number) {
  return (
    Number.isInteger(midiNote) && midiNote >= MIDI_MIN && midiNote <= MIDI_MAX
  );
}
