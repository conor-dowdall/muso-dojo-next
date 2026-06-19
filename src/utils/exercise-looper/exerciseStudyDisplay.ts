import {
  type ExerciseDisplayNote,
  type ExercisePatternMode,
  type ExerciseSequence,
} from "./exerciseSequence";
import {
  resolveCollectionPositionMatch,
  type CollectionPositionIdentity,
} from "@/utils/music-theory/collectionPositionIdentity";
import { getIntervalLabelDegree } from "@/utils/music-theory/intervalLabel";

export type ExerciseStudyAnchorIdentity = CollectionPositionIdentity;

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

export function createExerciseStudyAnchorIdentity(
  sequence: ExerciseSequence,
  note: Pick<ExerciseDisplayNote, "collectionPosition" | "intervalLabel">,
): ExerciseStudyAnchorIdentity {
  return {
    collectionPosition: note.collectionPosition,
    collectionSize: sequence.collectionSize,
    intervalDegree: getIntervalLabelDegree(note.intervalLabel),
  };
}

function getExerciseStudyAnchorCandidates(sequence: ExerciseSequence) {
  return sequence.notes.map((note) =>
    createExerciseStudyAnchorIdentity(sequence, note),
  );
}

/**
 * Study readouts carry a selected collection position across root, collection,
 * and mode changes. Like-sized collections preserve the same modal slot. When
 * the collection size changes, the readout preserves the musical degree
 * instead, so a triad's 1-3-5 maps to a scale's 1-3-5 instead of 1-2-3.
 */
export function resolveExerciseStudyAnchorPosition({
  activeAnchorPosition,
  selectedAnchor,
  sequence,
}: {
  activeAnchorPosition?: number;
  selectedAnchor?: ExerciseStudyAnchorIdentity;
  sequence: ExerciseSequence;
}) {
  if (
    activeAnchorPosition !== undefined &&
    hasAnchorPosition(sequence, activeAnchorPosition)
  ) {
    return activeAnchorPosition;
  }

  if (selectedAnchor !== undefined) {
    const match = resolveCollectionPositionMatch({
      candidates: getExerciseStudyAnchorCandidates(sequence),
      identity: selectedAnchor,
    });

    if (match !== undefined) {
      return match.collectionPosition;
    }
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
  selectedAnchor,
  mode,
  sequence,
}: {
  activeAnchorPosition?: number;
  selectedAnchor?: ExerciseStudyAnchorIdentity;
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
    selectedAnchor,
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
