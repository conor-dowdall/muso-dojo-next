import { describe, expect, it } from "vitest";
import {
  exerciseSubdivisionChoices,
  getExerciseSubdivisionAriaLabel,
  getExerciseSubdivisionDensityLabel,
  getExerciseSubdivisionLabel,
  getExerciseSubdivisionNoteLabel,
} from "@/utils/exercise-looper/exerciseRhythm";

describe("exercise rhythm controls", () => {
  it("offers subdivision densities from one through eight per beat", () => {
    expect(exerciseSubdivisionChoices.map((choice) => choice.text)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ]);
    expect(exerciseSubdivisionChoices.map((choice) => choice.label)).toContain(
      "Use 5 subdivisions per beat",
    );
  });

  it("labels densities and their musical note names", () => {
    expect(getExerciseSubdivisionLabel("eighth-triplet")).toBe(
      "Eighth-Note Triplets",
    );
    expect(getExerciseSubdivisionDensityLabel("eighth-triplet")).toBe(
      "3 per Beat",
    );
    expect(getExerciseSubdivisionNoteLabel("eighth-triplet")).toBe(
      "Eighth-Note Triplets",
    );
    expect(getExerciseSubdivisionAriaLabel("septuplet")).toBe(
      "Septuplets, 7 per Beat",
    );
  });
});
