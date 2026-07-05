import {
  formatMidiNote,
  formatNoteNameWithMidiOctave,
  getScientificPitchOctaveForMidiNote,
  type MidiNoteSpellingPreference,
} from "@musodojo/music-theory-data";

export {
  formatMidiNote,
  formatNoteNameWithMidiOctave,
  getScientificPitchOctaveForMidiNote,
};
export type { MidiNoteSpellingPreference };

export const getMidiOctave = getScientificPitchOctaveForMidiNote;

export const formatSpelledMidiNote = formatNoteNameWithMidiOctave;
