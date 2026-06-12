import { describe, expect, it } from "vitest";
import {
  getCollectionToneAtPosition,
  getCollectionToneSequenceMetadata,
} from "@/utils/music-theory/collectionToneSequence";

describe("collection tone sequences", () => {
  it("preserves ordinary collection cycles", () => {
    expect(getCollectionToneAtPosition("ionian", -1)).toMatchObject({
      collectionIndex: 6,
      intervalLabel: "7",
      octave: -1,
      semitones: -1,
    });
    expect(getCollectionToneAtPosition("ionian", 7)).toMatchObject({
      collectionIndex: 0,
      intervalLabel: "8",
      octave: 1,
      semitones: 12,
    });
  });

  it.each([
    ["major9", [0, 4, 7, 11, 14], ["1", "3", "5", "7", "9"]],
    ["majorAdd9", [0, 4, 7, 14], ["1", "3", "5", "9"]],
    ["dominant11", [0, 4, 7, 10, 14, 17], ["1", "3", "5", "♭7", "9", "11"]],
    [
      "dominant13",
      [0, 4, 7, 10, 14, 17, 21],
      ["1", "3", "5", "♭7", "9", "11", "13"],
    ],
  ] as const)(
    "uses the declared %s formula as the first finite register",
    (collectionKey, expectedSemitones, expectedIntervals) => {
      const metadata = getCollectionToneSequenceMetadata(collectionKey);
      const tones = Array.from(
        { length: expectedSemitones.length },
        (_, position) => getCollectionToneAtPosition(collectionKey, position),
      );

      expect(metadata.isFiniteVoicing).toBe(true);
      expect(metadata.supportsOctaveRangeEditing).toBe(true);
      expect(tones.map((tone) => tone?.semitones)).toEqual(expectedSemitones);
      expect(tones.map((tone) => tone?.intervalLabel)).toEqual(
        expectedIntervals,
      );
      expect(
        getCollectionToneAtPosition(collectionKey, expectedSemitones.length),
      ).toMatchObject({
        collectionIndex: 0,
        intervalLabel: "8",
        octave: 1,
        semitones: 12,
      });
    },
  );

  it("aligns finite voicing columns by pitch class", () => {
    const major9 = getCollectionToneSequenceMetadata("major9");
    const dominant13 = getCollectionToneSequenceMetadata("dominant13");

    expect(major9.columnCount).toBe(5);
    expect(major9.tones.map((tone) => tone.columnIndex)).toEqual([
      0, 2, 3, 4, 1,
    ]);
    expect(dominant13.columnCount).toBe(7);
    expect(dominant13.tones.map((tone) => tone.columnIndex)).toEqual([
      0, 2, 4, 6, 1, 3, 5,
    ]);
  });

  it("repeats finite formulas in package order across registers", () => {
    const tones = Array.from({ length: 10 }, (_, position) =>
      getCollectionToneAtPosition("major9", position),
    );

    expect(tones.map((tone) => tone?.semitones)).toEqual([
      0, 4, 7, 11, 14, 12, 16, 19, 23, 26,
    ]);
    expect(tones.map((tone) => tone?.intervalLabel)).toEqual([
      "1",
      "3",
      "5",
      "7",
      "9",
      "8",
      "10",
      "12",
      "14",
      "16",
    ]);
  });

  it.each([
    ["ionian", 7],
    ["chromatic", 12],
    ["bluesPentatonic", 6],
    ["major", 3],
  ] as const)("keeps %s octave-cyclic", (collectionKey, nextOctavePosition) => {
    const metadata = getCollectionToneSequenceMetadata(collectionKey);
    const nextRoot = getCollectionToneAtPosition(
      collectionKey,
      nextOctavePosition,
    );

    expect(metadata.isFiniteVoicing).toBe(false);
    expect(metadata.supportsOctaveRangeEditing).toBe(true);
    expect(nextRoot).toMatchObject({
      collectionIndex: 0,
      columnIndex: 0,
      intervalLabel: "8",
      octave: 1,
      semitones: 12,
    });
  });
});
