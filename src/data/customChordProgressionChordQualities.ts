import { type ChordCollectionKey } from "@musodojo/music-theory-data";

export interface CustomChordProgressionChordChoice {
  chordCollectionKey: ChordCollectionKey;
  label: string;
}

function chordChoice(
  chordCollectionKey: ChordCollectionKey,
  label: string,
): CustomChordProgressionChordChoice {
  return {
    chordCollectionKey,
    label,
  };
}

export const customProgressionCommonChordChoices = [
  chordChoice("major", "Major"),
  chordChoice("minor", "Minor"),
  chordChoice("dominant7", "Dominant 7"),
] as const satisfies readonly CustomChordProgressionChordChoice[];

export const customProgressionMoreChordChoices = [
  chordChoice("major7", "Major 7"),
  chordChoice("minor7", "Minor 7"),
  chordChoice("diminishedTriad", "Diminished"),
  chordChoice("halfDiminished7", "Half-Diminished 7"),
  chordChoice("diminished7", "Diminished 7"),
  chordChoice("augmentedTriad", "Augmented"),
  chordChoice("augmented7", "Augmented 7"),
  chordChoice("augmentedMajor7", "Augmented Major 7"),
] as const satisfies readonly CustomChordProgressionChordChoice[];

const customChordProgressionChordCollectionKeySet = new Set<string>([
  ...customProgressionCommonChordChoices.map(
    (choice) => choice.chordCollectionKey,
  ),
  ...customProgressionMoreChordChoices.map(
    (choice) => choice.chordCollectionKey,
  ),
]);

export function isCustomChordProgressionChordCollectionKey(
  value: unknown,
): value is ChordCollectionKey {
  return (
    typeof value === "string" &&
    customChordProgressionChordCollectionKeySet.has(value)
  );
}
