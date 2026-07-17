import { describe, expect, it } from "vitest";
import {
  customProgressionCommonChordChoices,
  customProgressionMoreChordChoices,
} from "@/components/music-theory/ChordQualityPicker";

describe("ChordQualityPicker", () => {
  it("keeps the high-frequency chord vocabulary immediately available", () => {
    expect(
      customProgressionCommonChordChoices.map(
        (choice) => choice.chordCollectionKey,
      ),
    ).toEqual(["major", "minor", "dominant7"]);
  });

  it("progressively discloses the remaining curated chords", () => {
    expect(
      customProgressionMoreChordChoices.map(
        (choice) => choice.chordCollectionKey,
      ),
    ).toEqual([
      "major7",
      "minor7",
      "diminishedTriad",
      "halfDiminished7",
      "diminished7",
      "augmentedTriad",
      "augmented7",
      "augmentedMajor7",
    ]);
  });
});
