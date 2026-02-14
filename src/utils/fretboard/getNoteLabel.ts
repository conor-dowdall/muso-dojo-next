import {
  type ActiveNote,
  type FretboardNoteLabelType,
} from "@/types/fretboard";

interface GetNoteLabelOptions {
  note: ActiveNote;
  labelType: FretboardNoteLabelType;
  noteNames?: string[];
  rootNote?: string;
}

export function getNoteLabel({
  note,
  labelType,
  noteNames,
  // rootNote, // Future use for interval/solfege
}: GetNoteLabelOptions): string | number | undefined {
  switch (labelType) {
    case "midi":
      return note.midi;
    case "note-name":
      return noteNames ? noteNames[note.midi % 12] : undefined;
    // Future implementation:
    // case "interval":
    //   return calculateInterval(rootNote, note.midi);
    // case "solfege":
    //   return calculateSolfege(rootNote, note.midi);
    default:
      return note.midi;
  }
}
