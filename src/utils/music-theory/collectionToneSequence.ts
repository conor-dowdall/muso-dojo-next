import {
  noteCollections,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";
import { shiftIntervalLabelByOctaves } from "./intervalLabel";

const SEMITONES_PER_OCTAVE = 12;

export interface CollectionTone {
  collectionIndex: number;
  columnIndex: number;
  intervalLabel: string;
  octave: number;
  semitones: number;
}

export interface CollectionToneSequenceMetadata {
  columnCount: number;
  isFiniteVoicing: boolean;
  supportsOctaveRangeEditing: boolean;
  tones: readonly CollectionTone[];
}

const metadataByCollectionKey = new Map<
  NoteCollectionKey,
  CollectionToneSequenceMetadata
>();

function floorDivide(value: number, divisor: number) {
  return Math.floor(value / divisor);
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function getFiniteVoicingColumns(integers: readonly number[]) {
  const pitchClasses = [
    ...new Set(
      integers.map((semitones) => modulo(semitones, SEMITONES_PER_OCTAVE)),
    ),
  ].toSorted((left, right) => left - right);

  return {
    columnByPitchClass: new Map(
      pitchClasses.map((pitchClass, columnIndex) => [pitchClass, columnIndex]),
    ),
    columnCount: pitchClasses.length,
  };
}

function createMetadata(
  collectionKey: NoteCollectionKey,
): CollectionToneSequenceMetadata {
  const collection = noteCollections[collectionKey];
  const integers: readonly number[] = collection.integers;
  const intervals: readonly unknown[] = collection.intervals;
  const isFiniteVoicing = integers.some(
    (semitones) => semitones >= SEMITONES_PER_OCTAVE,
  );
  const finiteColumns = isFiniteVoicing
    ? getFiniteVoicingColumns(integers)
    : undefined;
  const tones = integers.map(
    (semitones: number, collectionIndex: number): CollectionTone => {
      const octave = floorDivide(semitones, SEMITONES_PER_OCTAVE);
      const columnIndex = isFiniteVoicing
        ? (finiteColumns?.columnByPitchClass.get(
            modulo(semitones, SEMITONES_PER_OCTAVE),
          ) ?? 0)
        : collectionIndex;

      return {
        collectionIndex,
        columnIndex,
        intervalLabel: String(
          intervals[collectionIndex] ?? collectionIndex + 1,
        ),
        octave,
        semitones,
      };
    },
  );

  return {
    columnCount: finiteColumns?.columnCount ?? tones.length,
    isFiniteVoicing,
    supportsOctaveRangeEditing: true,
    tones,
  };
}

export function getCollectionToneSequenceMetadata(
  collectionKey: NoteCollectionKey,
) {
  const existing = metadataByCollectionKey.get(collectionKey);

  if (existing) {
    return existing;
  }

  const metadata = createMetadata(collectionKey);
  metadataByCollectionKey.set(collectionKey, metadata);
  return metadata;
}

export function getCollectionToneAtPosition(
  collectionKey: NoteCollectionKey,
  position: number,
): CollectionTone | undefined {
  const metadata = getCollectionToneSequenceMetadata(collectionKey);
  const resolvedPosition = Math.trunc(position);
  const collectionSize = metadata.tones.length;

  if (collectionSize === 0) {
    return undefined;
  }

  const cycle = floorDivide(resolvedPosition, collectionSize);
  const baseTone = metadata.tones[modulo(resolvedPosition, collectionSize)];

  if (!baseTone) {
    return undefined;
  }

  const semitones = baseTone.semitones + cycle * SEMITONES_PER_OCTAVE;

  return {
    ...baseTone,
    intervalLabel:
      cycle < 0
        ? baseTone.intervalLabel
        : shiftIntervalLabelByOctaves(baseTone.intervalLabel, cycle),
    octave: floorDivide(semitones, SEMITONES_PER_OCTAVE),
    semitones,
  };
}
