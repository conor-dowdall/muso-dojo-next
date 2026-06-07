import { describe, expect, it } from "vitest";
import {
  createExerciseSequence,
  getExerciseIntervalLabel,
  getExerciseIntervalRunLabel,
  getExerciseStackLabel,
} from "@/utils/exercise-looper/exerciseSequence";

describe("createExerciseSequence", () => {
  it("creates a one-octave major scale and holds the turning notes", () => {
    const sequence = createExerciseSequence({
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.steps.map((step) => step.note.midi)).toEqual([
      48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50, 48,
    ]);
    expect(sequence.steps[0]?.durationUnits).toBe(2);
    expect(sequence.steps[7]?.durationUnits).toBe(2);
  });

  it("creates an interval run in diatonic thirds", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 2 },
      noteCollectionKey: "ionian",
      pattern: { interval: 3, kind: "interval-run" },
      rootNote: "C",
    });

    expect(sequence.steps.map((step) => step.note.midi)).toEqual([
      48, 52, 50, 53, 52, 55,
    ]);
  });

  it("creates cumulative thirteenth stacks without chord tables", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "melodicMinor",
      pattern: { kind: "diatonic-stack", size: 7 },
      rootNote: "C",
    });

    expect(sequence.steps.map((step) => step.note.midi)).toEqual([
      48, 51, 55, 59, 62, 65, 69,
    ]);
    expect(sequence.supportsTertianExercises).toBe(true);
  });

  it("does not advertise tertian exercises for chromatic collections", () => {
    expect(
      createExerciseSequence({
        noteCollectionKey: "chromatic",
      }).supportsTertianExercises,
    ).toBe(false);
  });
});

describe("exercise labels", () => {
  it("formats interval and stack choices", () => {
    expect(getExerciseIntervalLabel(3)).toBe("3rd");
    expect(getExerciseIntervalLabel(11)).toBe("11th");
    expect(getExerciseIntervalRunLabel(3)).toBe("Thirds");
    expect(getExerciseStackLabel(7)).toBe("Thirteenths");
  });
});
