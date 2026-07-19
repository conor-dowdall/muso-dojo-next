import {
  DIATONIC_STEPS_PER_OCTAVE,
  noteCollection,
  shiftIntervalLabelByOctaves,
  type NoteCollectionKey,
} from "@musodojo/music-theory-data";

const SEMITONES_PER_OCTAVE = 12;

export interface CollectionTonePresentation {
  collectionIndex: number;
  columnIndex: number;
  intervalDegree?: number;
  intervalLabel: string;
  octave: number;
  semitones: number;
}

export interface CollectionTonePresentationMetadata {
  columnCount: number;
  degreeSignature?: string;
  isFiniteVoicing: boolean;
  supportsOctaveRangeEditing: boolean;
  tones: readonly CollectionTonePresentation[];
}

const presentationMetadataByCollectionKey = new Map<
  NoteCollectionKey,
  CollectionTonePresentationMetadata
>();

function getDegreeSignature(tones: readonly { intervalDegree?: number }[]) {
  const degrees = tones.map((tone) => tone.intervalDegree);

  return degrees.every((degree) => degree !== undefined)
    ? degrees.join(",")
    : undefined;
}

export function getCollectionTonePresentationMetadata(
  collectionKey: NoteCollectionKey,
): CollectionTonePresentationMetadata {
  const existing = presentationMetadataByCollectionKey.get(collectionKey);

  if (existing) {
    return existing;
  }

  const sequence = noteCollection.getToneSequence(collectionKey);
  const tones = sequence.tones.map((tone): CollectionTonePresentation => ({
    collectionIndex: tone.collectionIndex,
    columnIndex: tone.pitchClassIndex,
    intervalDegree: tone.intervalDegree,
    intervalLabel: tone.interval,
    octave: tone.octaveOffset,
    semitones: tone.semitones,
  }));

  const metadata = {
    columnCount: sequence.pitchClasses.length,
    degreeSignature: getDegreeSignature(tones),
    isFiniteVoicing: sequence.hasCompoundIntervals,
    supportsOctaveRangeEditing: true,
    tones,
  };

  presentationMetadataByCollectionKey.set(collectionKey, metadata);
  return metadata;
}

export function getCollectionTonePresentationAtPosition(
  collectionKey: NoteCollectionKey,
  position: number,
): CollectionTonePresentation | undefined {
  const tone = noteCollection.getToneAtPosition(collectionKey, position);

  if (!tone) {
    return undefined;
  }

  const intervalDegree =
    tone.intervalDegree === undefined || tone.cycle < 0
      ? tone.intervalDegree
      : tone.intervalDegree + tone.cycle * DIATONIC_STEPS_PER_OCTAVE;

  return {
    collectionIndex: tone.collectionIndex,
    columnIndex: tone.pitchClassIndex,
    intervalDegree,
    intervalLabel:
      tone.cycle < 0
        ? tone.interval
        : shiftIntervalLabelByOctaves(tone.interval, tone.cycle),
    octave: Math.floor(tone.resolvedSemitones / SEMITONES_PER_OCTAVE),
    semitones: tone.resolvedSemitones,
  };
}
