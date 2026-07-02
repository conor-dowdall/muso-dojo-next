import { type ExerciseSubdivision } from "@/types/session";
import {
  beatSubdivisionOptions,
  getBeatSubdivisionDensityLabel,
  getBeatSubdivisionNoteLabel,
} from "@/utils/music-theory/beatSubdivision";

export const exerciseSubdivisionChoices = beatSubdivisionOptions.map(
  (option) => ({
    label: option.controlLabel,
    noteLabel: option.noteLabel,
    subdivision: option.id,
    text: String(option.countPerBeat),
  }),
) satisfies readonly {
  label: string;
  noteLabel: string;
  subdivision: ExerciseSubdivision;
  text: string;
}[];

export function getExerciseSubdivisionAriaLabel(
  subdivision: ExerciseSubdivision,
) {
  return `${getBeatSubdivisionNoteLabel(subdivision)}, ${getBeatSubdivisionDensityLabel(
    subdivision,
  )}`;
}

export function getExerciseSubdivisionLabel(subdivision: ExerciseSubdivision) {
  return getBeatSubdivisionNoteLabel(subdivision);
}

export function getExerciseSubdivisionDensityLabel(
  subdivision: ExerciseSubdivision,
) {
  return getBeatSubdivisionDensityLabel(subdivision);
}

export function getExerciseSubdivisionNoteLabel(
  subdivision: ExerciseSubdivision,
) {
  return getBeatSubdivisionNoteLabel(subdivision);
}
