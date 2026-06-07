import { describe, expect, it } from "vitest";
import {
  getExerciseDegreeOptions,
  getNearestExerciseDegree,
  normalizeExercisePattern,
} from "@/utils/exercise-looper/exerciseConfig";

describe("exercise pattern configuration", () => {
  it("normalizes orthogonal pattern controls", () => {
    expect(
      normalizeExercisePattern({
        degree: 7,
        direction: "descending",
        mode: "extension",
      }),
    ).toEqual({
      degree: 7,
      direction: "descending",
      mode: "extension",
    });
    expect(
      normalizeExercisePattern({
        degree: 4,
        direction: "ascending",
        mode: "extension",
      }),
    ).toBeUndefined();
  });

  it("offers every interval and only tertian extension degrees", () => {
    expect(getExerciseDegreeOptions("interval")).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(getExerciseDegreeOptions("extension")).toEqual([3, 5, 7, 9, 11, 13]);
  });

  it("snaps mode changes to the nearest musically valid degree", () => {
    expect(getNearestExerciseDegree(4, "extension")).toBe(3);
    expect(getNearestExerciseDegree(12, "extension")).toBe(11);
    expect(getNearestExerciseDegree(8, "interval")).toBe(8);
  });
});
