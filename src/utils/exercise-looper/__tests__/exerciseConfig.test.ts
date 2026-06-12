import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXERCISE_PATTERN,
  getExerciseDegreeOptions,
  normalizeExercisePattern,
} from "@/utils/exercise-looper/exerciseConfig";

describe("exercise pattern configuration", () => {
  it("normalizes orthogonal pattern controls", () => {
    expect(
      normalizeExercisePattern({
        direction: "descending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 6,
        intervalDirection: "descending",
        mode: "extension",
        notePlayback: "together",
      }),
    ).toEqual({
      direction: "descending",
      extensionDegree: 7,
      extensionDirection: "ascending",
      intervalDegree: 6,
      intervalDirection: "descending",
      mode: "extension",
      notePlayback: "together",
    });
    expect(
      normalizeExercisePattern({
        direction: "ascending",
        extensionDegree: 4,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "separate",
      }),
    ).toBeUndefined();
  });

  it("fills omitted contextual controls with their defaults", () => {
    expect(
      normalizeExercisePattern({
        direction: "ascending",
        extensionDegree: 5,
        intervalDegree: 4,
        mode: "interval",
      }),
    ).toEqual({
      direction: "ascending",
      extensionDegree: 5,
      extensionDirection: "up-down",
      intervalDegree: 4,
      intervalDirection: "up-down",
      mode: "interval",
      notePlayback: "separate",
    });
  });

  it("offers every interval and only tertian extension degrees", () => {
    expect(getExerciseDegreeOptions("interval")).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(getExerciseDegreeOptions("extension")).toEqual([5, 7, 9, 11, 13]);
    expect(DEFAULT_EXERCISE_PATTERN.extensionDegree).toBe(5);
  });

  it("rejects the removed third-only chord size", () => {
    expect(
      normalizeExercisePattern({
        direction: "ascending",
        extensionDegree: 3,
        intervalDegree: 3,
        mode: "extension",
      }),
    ).toBeUndefined();
  });
});
