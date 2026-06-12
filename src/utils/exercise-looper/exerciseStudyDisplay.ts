import {
  type ExerciseChordDescriptor,
  type ExercisePatternMode,
} from "./exerciseSequence";

export function resolveExerciseStudyChordDescriptor({
  activeChordDescriptor,
  focusedChordDescriptor,
  mode,
}: {
  activeChordDescriptor?: ExerciseChordDescriptor;
  focusedChordDescriptor?: ExerciseChordDescriptor;
  mode: ExercisePatternMode;
}) {
  return mode === "extension"
    ? (activeChordDescriptor ?? focusedChordDescriptor)
    : undefined;
}
