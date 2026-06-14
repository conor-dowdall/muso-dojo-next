import { describe, expect, it } from "vitest";
import {
  getExerciseRhythmSelection,
  getExerciseSubdivisionForRhythm,
  getExerciseSubdivisionLabel,
} from "@/utils/exercise-looper/exerciseRhythm";
import { type ExerciseSubdivision } from "@/types/session";

describe("exercise rhythm controls", () => {
  it.each([
    ["quarter", "quarter", "straight"],
    ["eighth", "eighth", "straight"],
    ["eighth-triplet", "eighth", "triplet"],
    ["sixteenth", "sixteenth", "straight"],
    ["sixteenth-triplet", "sixteenth", "triplet"],
  ] as const)(
    "resolves %s into a note value and feel",
    (subdivision, noteValue, feel) => {
      expect(getExerciseRhythmSelection(subdivision)).toEqual({
        feel,
        noteValue,
      });
    },
  );

  it.each([
    ["quarter", "straight", "quarter"],
    ["quarter", "triplet", "quarter"],
    ["eighth", "straight", "eighth"],
    ["eighth", "triplet", "eighth-triplet"],
    ["sixteenth", "straight", "sixteenth"],
    ["sixteenth", "triplet", "sixteenth-triplet"],
  ] as const)(
    "maps %s notes with %s feel to %s",
    (noteValue, feel, subdivision) => {
      expect(
        getExerciseSubdivisionForRhythm({ feel, noteValue }),
      ).toBe<ExerciseSubdivision>(subdivision);
    },
  );

  it("provides concise Title Case display labels", () => {
    expect(getExerciseSubdivisionLabel("eighth-triplet")).toBe(
      "Eighth-Note Triplets",
    );
  });
});
