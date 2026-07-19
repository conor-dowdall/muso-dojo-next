import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXERCISE_PATTERN,
  getExerciseDegreeOptions,
  normalizeExercisePattern,
  normalizeExerciseSubdivision,
} from "@/utils/exercise-looper/exerciseConfig";

describe("exercise pattern configuration", () => {
  it.each([
    ["quarter", "1-per-beat"],
    ["eighth", "2-per-beat"],
    ["eighth-triplet", "3-per-beat"],
    ["sixteenth", "4-per-beat"],
    ["quintuplet", "5-per-beat"],
    ["sixteenth-triplet", "6-per-beat"],
    ["septuplet", "7-per-beat"],
    ["thirty-second", "8-per-beat"],
  ] as const)("normalizes legacy subdivision %s", (legacy, canonical) => {
    expect(normalizeExerciseSubdivision(legacy)).toBe(canonical);
  });

  it("preserves canonical subdivisions", () => {
    expect(normalizeExerciseSubdivision("6-per-beat")).toBe("6-per-beat");
  });

  it("normalizes orthogonal pattern controls", () => {
    expect(
      normalizeExercisePattern({
        direction: "down-up",
        extensionDegree: 7,
        extensionDirection: "down-up",
        intervalDegree: 6,
        intervalDirection: "down-up",
        mode: "extension",
        notePlayback: "together",
      }),
    ).toEqual({
      direction: "down-up",
      extensionDegree: 7,
      extensionDirection: "down-up",
      intervalDegree: 6,
      intervalDirection: "down-up",
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

  it("rejects unsupported extension degrees", () => {
    expect(
      normalizeExercisePattern({
        direction: "ascending",
        extensionDegree: 3,
        extensionDirection: "descending",
        intervalDegree: 4,
        intervalDirection: "ascending",
        mode: "extension",
        notePlayback: "together",
      }),
    ).toBeUndefined();
  });
});
