import {
  type ExerciseDisplayNote,
  type ExercisePatternMode,
  type ExerciseSequence,
} from "./exerciseSequence";

export type ExerciseStudyDisplay =
  | {
      intervals: readonly string[];
      kind: "notes";
      notes: readonly string[];
    }
  | {
      chordName: string;
      intervals: readonly string[];
      kind: "chord";
      notes: readonly string[];
    };

function hasAnchorPosition(sequence: ExerciseSequence, position: number) {
  return sequence.notes.some((note) => note.collectionPosition === position);
}

/**
 * Study readouts carry a selected collection position across root, collection,
 * and mode changes. That preserves the musical comparison point: for example,
 * a selected third can naturally become major, minor, or altered as the
 * surrounding collection changes.
 */
export function resolveExerciseStudyAnchorPosition({
  activeAnchorPosition,
  selectedAnchorPosition,
  sequence,
}: {
  activeAnchorPosition?: number;
  selectedAnchorPosition?: number;
  sequence: ExerciseSequence;
}) {
  if (
    activeAnchorPosition !== undefined &&
    hasAnchorPosition(sequence, activeAnchorPosition)
  ) {
    return activeAnchorPosition;
  }

  if (
    selectedAnchorPosition !== undefined &&
    hasAnchorPosition(sequence, selectedAnchorPosition)
  ) {
    return selectedAnchorPosition;
  }

  return sequence.notes[0]?.collectionPosition;
}

export function getExerciseAnchorDisplayNotes(
  sequence: ExerciseSequence,
  anchorPosition: number,
) {
  const positions = new Set(
    sequence.steps.flatMap((step) =>
      step.notes.flatMap((note) =>
        note.anchorPosition === anchorPosition ? [note.collectionPosition] : [],
      ),
    ),
  );
  const noteByPosition = new Map(
    sequence.displayNotes.map(
      (note) => [note.collectionPosition, note] as const,
    ),
  );

  return [...positions]
    .toSorted((left, right) => left - right)
    .flatMap((position): ExerciseDisplayNote[] => {
      const note = noteByPosition.get(position);
      return note === undefined ? [] : [note];
    });
}

export function resolveExerciseStudyDisplay({
  activeAnchorPosition,
  selectedAnchorPosition,
  mode,
  sequence,
}: {
  activeAnchorPosition?: number;
  selectedAnchorPosition?: number;
  mode: ExercisePatternMode;
  sequence: ExerciseSequence;
}): ExerciseStudyDisplay {
  if (mode === "single") {
    return {
      intervals: sequence.studyReference.map((note) => note.intervalLabel),
      kind: "notes",
      notes: sequence.studyReference.map((note) => note.label),
    };
  }

  const anchorPosition = resolveExerciseStudyAnchorPosition({
    activeAnchorPosition,
    selectedAnchorPosition,
    sequence,
  });

  if (mode === "extension" && anchorPosition !== undefined) {
    const chordDescriptor =
      sequence.chordDescriptorsByAnchorPosition.get(anchorPosition);

    if (chordDescriptor !== undefined) {
      const notes = getExerciseAnchorDisplayNotes(sequence, anchorPosition);

      return {
        chordName: chordDescriptor.chordName,
        intervals: chordDescriptor.intervals,
        kind: "chord",
        notes: notes.map((note) => note.label),
      };
    }
  }

  const intervalDescriptor =
    mode === "interval" && anchorPosition !== undefined
      ? sequence.intervalDescriptorsByAnchorPosition.get(anchorPosition)
      : undefined;
  const notes =
    anchorPosition === undefined
      ? []
      : getExerciseAnchorDisplayNotes(sequence, anchorPosition);

  return {
    intervals: intervalDescriptor?.intervals ?? [],
    kind: "notes",
    notes: notes.map((note) => note.label),
  };
}
