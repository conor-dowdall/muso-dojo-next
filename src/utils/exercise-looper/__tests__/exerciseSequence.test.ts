import { describe, expect, it } from "vitest";
import {
  createExerciseSequence,
  getExerciseIntervalLabel,
  getExerciseIntervalRunLabel,
  getExerciseStackLabel,
} from "@/utils/exercise-looper/exerciseSequence";

describe("createExerciseSequence", () => {
  it("creates a beat-even, loop-safe one-octave pendulum", () => {
    const sequence = createExerciseSequence({
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.steps.map((step) => step.note.midi)).toEqual([
      48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50,
    ]);
    expect(sequence.steps.every((step) => step.durationUnits === 1)).toBe(true);
  });

  it("lays the editable notes out in octave-aligned rows", () => {
    const sequence = createExerciseSequence({
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.rows.map((row) => row.map((note) => note.midi))).toEqual([
      [48, 50, 52, 53, 55, 57, 59],
      [60],
    ]);
    expect(
      sequence.rows.map((row) => row.map((note) => note.columnIndex)),
    ).toEqual([[0, 1, 2, 3, 4, 5, 6], [0]]);
  });

  it("wraps each added note into the next octave row", () => {
    const sequence = createExerciseSequence({
      end: { octave: 1, stepOffset: 2 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.rows.map((row) => row.map((note) => note.midi))).toEqual([
      [48, 50, 52, 53, 55, 57, 59],
      [60, 62, 64],
    ]);
  });

  it("supports a one-note exercise range", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.notes.map((note) => note.midi)).toEqual([48]);
    expect(sequence.steps.map((step) => step.note.midi)).toEqual([48]);
  });

  it("limits an exercise range to four octaves while retaining the top root", () => {
    const sequence = createExerciseSequence({
      end: { octave: 8, stepOffset: 0 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.lastPosition - sequence.firstPosition).toBe(28);
    expect(sequence.rows).toHaveLength(5);
    expect(sequence.rows.at(-1)).toHaveLength(1);
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
