import {
  getChordQualityChordCollectionKey,
  type ChordCollectionKey,
  type ChordQuality,
} from "@musodojo/music-theory-data";

export interface CustomChordProgressionChordChoice {
  chordCollectionKey: ChordCollectionKey;
  label: string;
}

function qualityChoice(
  quality: ChordQuality,
  label: string,
): CustomChordProgressionChordChoice {
  return {
    chordCollectionKey: getChordQualityChordCollectionKey(quality),
    label,
  };
}

export const customProgressionCommonChordChoices = [
  qualityChoice("M", "Major"),
  qualityChoice("m", "Minor"),
  qualityChoice("7", "Dominant 7"),
] as const satisfies readonly CustomChordProgressionChordChoice[];

export const customProgressionMoreChordChoices = [
  qualityChoice("M7", "Major 7"),
  qualityChoice("m7", "Minor 7"),
  qualityChoice("°", "Diminished"),
  qualityChoice("ø7", "Half-Diminished 7"),
  qualityChoice("°7", "Diminished 7"),
  qualityChoice("+", "Augmented"),
  {
    chordCollectionKey: "augmented7",
    label: "Augmented 7",
  },
  qualityChoice("+M7", "Augmented Major 7"),
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
