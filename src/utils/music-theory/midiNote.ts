import {
  normalizeChromaticIndex,
  noteLabelCollections,
} from "@musodojo/music-theory-data";

export function getMidiOctave(midi: number) {
  return Math.floor(midi / 12) - 1;
}

export function formatMidiNote(midi: number) {
  const noteName =
    noteLabelCollections.noteNamesFlat.labels[normalizeChromaticIndex(midi)];
  const octave = getMidiOctave(midi);
  return `${noteName}${octave}`;
}

export function formatSpelledMidiNote(noteName: string, midi: number) {
  return noteName === "" ? "" : `${noteName}${getMidiOctave(midi)}`;
}
