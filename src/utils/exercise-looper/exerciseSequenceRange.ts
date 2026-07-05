import {
  isValidNoteCollectionKey,
  getScientificPitchOctaveForMidiNote,
  normalizeRootNoteString,
  noteCollections,
  rootNoteToIntegerMap,
  type NoteCollectionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { MIDI_MAX, MIDI_MIN, isPlayableMidiNote } from "@/audio/pitch";
import { getCollectionToneAtPosition } from "@/utils/music-theory/collectionToneSequence";
import {
  DEFAULT_PART_NOTE_COLLECTION_KEY,
  DEFAULT_PART_ROOT_NOTE,
} from "@/utils/session/sessionDefaults";
import { createPatternPositionGroups } from "./exercisePatternPositions";
import {
  type CollectionRangeBoundary,
  type ExercisePattern,
} from "./exerciseSequenceTypes";

const SEMITONES_PER_OCTAVE = 12;
const BASE_ROOT_MIDI = 48;
export const DEFAULT_EXERCISE_OCTAVE_OFFSET = -1;

export function getExerciseBaseOctave(octaveOffset = 0) {
  return getScientificPitchOctaveForMidiNote(
    BASE_ROOT_MIDI + octaveOffset * SEMITONES_PER_OCTAVE,
  );
}

export function resolveExerciseRootNote(value: unknown): RootNote {
  return typeof value === "string"
    ? (normalizeRootNoteString(value) ?? DEFAULT_PART_ROOT_NOTE)
    : DEFAULT_PART_ROOT_NOTE;
}

export function resolveExerciseCollectionKey(
  value: unknown,
): NoteCollectionKey {
  return typeof value === "string" && isValidNoteCollectionKey(value)
    ? value
    : DEFAULT_PART_NOTE_COLLECTION_KEY;
}

export function getCollectionPosition(
  boundary: CollectionRangeBoundary,
  collectionSize: number,
  isFiniteVoicing = false,
) {
  if (isFiniteVoicing && boundary.octave > 0) {
    return boundary.octave * collectionSize + boundary.stepOffset - 1;
  }

  return boundary.octave * collectionSize + boundary.stepOffset;
}

export function getCollectionRangeBoundary(
  position: number,
  collectionSize: number,
  isFiniteVoicing = false,
): CollectionRangeBoundary {
  if (isFiniteVoicing && position >= collectionSize - 1) {
    const octave = Math.floor((position + 1) / collectionSize);

    return {
      octave,
      stepOffset: position + 1 - octave * collectionSize,
    };
  }

  const octave = Math.floor(position / collectionSize);

  return {
    octave,
    stepOffset: position - octave * collectionSize,
  };
}

export function getMidiForCollectionPosition({
  collectionKey,
  octaveOffset = 0,
  position,
  rootNote,
}: {
  collectionKey: NoteCollectionKey;
  octaveOffset?: number;
  position: number;
  rootNote: RootNote;
}) {
  const tone = getCollectionToneAtPosition(collectionKey, position);

  if (!tone) {
    return undefined;
  }

  const rootInteger = rootNoteToIntegerMap.get(rootNote);

  if (rootInteger === undefined) {
    return undefined;
  }

  return (
    BASE_ROOT_MIDI +
    rootInteger +
    octaveOffset * SEMITONES_PER_OCTAVE +
    tone.semitones
  );
}

export function getExerciseAnchorPositionBounds({
  noteCollectionKey,
  octaveOffset = 0,
  pattern,
  rootNote,
}: {
  noteCollectionKey?: unknown;
  octaveOffset?: number;
  pattern: ExercisePattern;
  rootNote?: unknown;
}) {
  const resolvedCollectionKey = resolveExerciseCollectionKey(noteCollectionKey);
  const resolvedRootNote = resolveExerciseRootNote(rootNote);
  const collectionSize = noteCollections[resolvedCollectionKey].integers.length;
  const rootInteger = rootNoteToIntegerMap.get(resolvedRootNote) ?? 0;
  const rootMidi =
    BASE_ROOT_MIDI + rootInteger + octaveOffset * SEMITONES_PER_OCTAVE;
  const searchMin =
    Math.floor((MIDI_MIN - rootMidi) / SEMITONES_PER_OCTAVE) * collectionSize -
    collectionSize;
  const searchMax =
    Math.ceil((MIDI_MAX - rootMidi) / SEMITONES_PER_OCTAVE) * collectionSize +
    collectionSize;
  const playablePositions: number[] = [];

  for (let position = searchMin; position <= searchMax; position += 1) {
    const patternPositions = createPatternPositionGroups(
      position,
      pattern,
    ).flat();
    const isPlayable = patternPositions.every((patternPosition) => {
      const midi = getMidiForCollectionPosition({
        collectionKey: resolvedCollectionKey,
        octaveOffset,
        position: patternPosition,
        rootNote: resolvedRootNote,
      });
      return midi !== undefined && isPlayableMidiNote(midi);
    });

    if (isPlayable) {
      playablePositions.push(position);
    }
  }

  return {
    max: playablePositions.at(-1) ?? 0,
    min: playablePositions[0] ?? 0,
  };
}
