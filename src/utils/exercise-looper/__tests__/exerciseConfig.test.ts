import { describe, expect, it } from "vitest";
import {
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
        intervalPlayback: "together",
        mode: "extension",
      }),
    ).toEqual({
      direction: "descending",
      extensionDegree: 7,
      extensionDirection: "ascending",
      intervalDegree: 6,
      intervalPlayback: "together",
      mode: "extension",
    });
    expect(
      normalizeExercisePattern({
        direction: "ascending",
        extensionDegree: 4,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalPlayback: "separate",
        mode: "extension",
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
      intervalPlayback: "separate",
      mode: "interval",
    });
  });

  it("offers every interval and only tertian extension degrees", () => {
    expect(getExerciseDegreeOptions("interval")).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(getExerciseDegreeOptions("extension")).toEqual([3, 5, 7, 9, 11, 13]);
  });
});
