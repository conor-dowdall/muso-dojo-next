import {
  type Interval,
  type NoteCollectionKey,
  type NoteName,
} from "@musodojo/music-theory-data";

export const EXERCISE_INTERVAL_MIN = 2;
export const EXERCISE_INTERVAL_MAX = 13;
export const EXERCISE_MAX_OCTAVE_SPAN = 4;

export type ExerciseScaleDirection = "ascending" | "descending" | "up-down";
export type ExercisePatternMode = "single" | "interval" | "extension";
export type ExerciseNotePlayback = "separate" | "together";

export interface ExercisePattern {
  direction: ExerciseScaleDirection;
  extensionDegree: number;
  extensionDirection: ExerciseScaleDirection;
  intervalDegree: number;
  intervalDirection: ExerciseScaleDirection;
  mode: ExercisePatternMode;
  notePlayback: ExerciseNotePlayback;
}

export interface CollectionRangeBoundary {
  octave: number;
  stepOffset: number;
}

export interface ExerciseSequenceNote {
  anchorPosition: number;
  collectionPosition: number;
  midi: number;
}

export interface ExerciseDisplayNote {
  collectionPosition: number;
  columnIndex: number;
  intervalLabel: string;
  isAnchor: boolean;
  key: string;
  label: string;
  midi: number;
  rowIndex: number;
}

export interface ExerciseSequenceStep {
  durationUnits: number;
  notes: ExerciseSequenceNote[];
}

export interface ExerciseChordDescriptor {
  chordName: string;
  collectionPositions: readonly number[];
  intervals: readonly Interval[];
  midiNotes: readonly number[];
  relativeCollectionKey: NoteCollectionKey;
  rootName: NoteName;
}

export interface ExerciseSequence {
  chordDescriptorsByAnchorPosition: ReadonlyMap<
    number,
    ExerciseChordDescriptor
  >;
  collectionSize: number;
  columnCount: number;
  displayNotes: ExerciseDisplayNote[];
  displayRows: ExerciseDisplayNote[][];
  firstPosition: number;
  isFiniteVoicing: boolean;
  lastPosition: number;
  notes: ExerciseDisplayNote[];
  rows: ExerciseDisplayNote[][];
  steps: ExerciseSequenceStep[];
  supportsOctaveRangeEditing: boolean;
  supportsScaleDegreeExercises: boolean;
  supportsTertianExercises: boolean;
}
