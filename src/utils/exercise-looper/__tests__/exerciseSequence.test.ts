import { describe, expect, it } from "vitest";
import {
  createExerciseSequence,
  getCollectionPosition,
  getCollectionRangeBoundary,
  getExerciseIntervalLabel,
} from "@/utils/exercise-looper/exerciseSequence";

describe("createExerciseSequence", () => {
  it("creates a beat-even, loop-safe one-octave pendulum", () => {
    const sequence = createExerciseSequence({
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(
      sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([48, 50, 52, 53, 55, 57, 59, 60, 59, 57, 55, 53, 52, 50]);
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

  it("uses collection-derived note spellings and modal interval labels", () => {
    const sequence = createExerciseSequence({
      end: { octave: 1, stepOffset: 1 },
      noteCollectionKey: "ionian",
      rootNote: "F#",
    });

    expect(
      sequence.notes.map((note) => ({
        intervalLabel: note.intervalLabel,
        label: note.label,
      })),
    ).toEqual([
      { intervalLabel: "1", label: "F♯" },
      { intervalLabel: "2", label: "G♯" },
      { intervalLabel: "3", label: "A♯" },
      { intervalLabel: "4", label: "B" },
      { intervalLabel: "5", label: "C♯" },
      { intervalLabel: "6", label: "D♯" },
      { intervalLabel: "7", label: "E♯" },
      { intervalLabel: "8", label: "F♯" },
      { intervalLabel: "9", label: "G♯" },
    ]);
  });

  it("uses the declared finite compound formula by default", () => {
    const sequence = createExerciseSequence({
      noteCollectionKey: "major9",
      rootNote: "C",
    });

    expect(
      sequence.notes.map((note) => ({
        intervalLabel: note.intervalLabel,
        label: note.label,
      })),
    ).toEqual([
      { intervalLabel: "1", label: "C" },
      { intervalLabel: "3", label: "E" },
      { intervalLabel: "5", label: "G" },
      { intervalLabel: "7", label: "B" },
      { intervalLabel: "9", label: "D" },
    ]);
    expect(
      sequence.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([["1", "3", "5", "7"], ["9"]]);
    expect(
      sequence.rows.map((row) => row.map((note) => note.columnIndex)),
    ).toEqual([[0, 2, 3, 4], [1]]);
    expect(sequence.notes.map((note) => note.midi)).toEqual([
      48, 52, 55, 59, 62,
    ]);
    expect(sequence.lastPosition).toBe(4);
    expect(sequence.columnCount).toBe(5);
    expect(sequence.supportsOctaveRangeEditing).toBe(true);
  });

  it("adds and removes the next register root without removing the ninth", () => {
    const expanded = createExerciseSequence({
      end: { octave: 1, stepOffset: 1 },
      noteCollectionKey: "major9",
      rootNote: "C",
    });
    const restoredFormula = createExerciseSequence({
      end: { octave: 1, stepOffset: 0 },
      noteCollectionKey: "major9",
      rootNote: "C",
    });

    expect(
      expanded.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([
      ["1", "3", "5", "7"],
      ["8", "9"],
    ]);
    expect(
      expanded.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([48, 52, 55, 59, 62, 60, 62, 59, 55, 52]);
    expect(
      restoredFormula.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([["1", "3", "5", "7"], ["9"]]);
  });

  it("adds one complete finite formula register", () => {
    const sequence = createExerciseSequence({
      end: { octave: 2, stepOffset: 0 },
      noteCollectionKey: "major9",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "single",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(
      sequence.rows.map((row) => row.map((note) => note.intervalLabel)),
    ).toEqual([["1", "3", "5", "7"], ["8", "9", "10", "12", "14"], ["16"]]);
    expect(
      sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([48, 52, 55, 59, 62, 60, 64, 67, 71, 74]);
  });

  it.each([
    ["ascending", [48, 52, 55, 59, 62]],
    ["descending", [62, 59, 55, 52, 48]],
    ["up-down", [48, 52, 55, 59, 62, 59, 55, 52]],
  ] as const)(
    "plays a finite voicing in %s package order",
    (direction, expectedMidi) => {
      const sequence = createExerciseSequence({
        noteCollectionKey: "major9",
        pattern: {
          direction,
          extensionDegree: 5,
          extensionDirection: "up-down",
          intervalDegree: 3,
          intervalDirection: "up-down",
          mode: "single",
          notePlayback: "separate",
        },
        rootNote: "C",
      });

      expect(
        sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
      ).toEqual(expectedMidi);
    },
  );

  it("round-trips finite formula range boundaries without colliding with the default", () => {
    expect(getCollectionPosition({ octave: 1, stepOffset: 0 }, 5, true)).toBe(
      4,
    );
    expect(getCollectionRangeBoundary(4, 5, true)).toEqual({
      octave: 1,
      stepOffset: 0,
    });
    expect(getCollectionRangeBoundary(5, 5, true)).toEqual({
      octave: 1,
      stepOffset: 1,
    });
    expect(getCollectionPosition({ octave: 2, stepOffset: 0 }, 5, true)).toBe(
      9,
    );
  });

  it("supports a one-note exercise range", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(sequence.notes.map((note) => note.midi)).toEqual([48]);
    expect(
      sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([48]);
  });

  it("adds interval tones to the display without making them anchors", () => {
    const third = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "ascending",
        mode: "interval",
        notePlayback: "separate",
      },
      rootNote: "C",
    });
    const thirteenth = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 13,
        intervalDirection: "ascending",
        mode: "interval",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(third.notes.map((note) => note.midi)).toEqual([48]);
    expect(
      third.displayNotes.map((note) => ({
        isAnchor: note.isAnchor,
        midi: note.midi,
      })),
    ).toEqual([
      { isAnchor: true, midi: 48 },
      { isAnchor: false, midi: 52 },
    ]);
    expect(thirteenth.notes.map((note) => note.midi)).toEqual([48]);
    expect(thirteenth.displayNotes.map((note) => note.midi)).toEqual([48, 69]);
    expect(thirteenth.displayRows).toHaveLength(2);
  });

  it("adds every generated chord tone above the anchor range", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 13,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(sequence.notes.map((note) => note.midi)).toEqual([48]);
    expect(sequence.displayNotes.map((note) => note.midi)).toEqual([
      48, 52, 55, 59, 62, 65, 69,
    ]);
    expect(sequence.displayNotes.map((note) => note.isAnchor)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
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

  it("bounds a four-octave interval range plus a thirteenth to seven display rows", () => {
    const sequence = createExerciseSequence({
      end: { octave: 4, stepOffset: 6 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 13,
        intervalDirection: "ascending",
        mode: "interval",
        notePlayback: "separate",
      },
      rootNote: "C",
      start: { octave: 0, stepOffset: 6 },
    });

    expect(sequence.lastPosition - sequence.firstPosition).toBe(28);
    expect(sequence.rows).toHaveLength(5);
    expect(sequence.displayRows).toHaveLength(7);
    expect(sequence.displayNotes.at(-1)?.collectionPosition).toBe(46);
    expect(sequence.displayNotes.at(-1)?.isAnchor).toBe(false);
  });

  it("creates an interval run in diatonic thirds", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 2 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "ascending",
        mode: "interval",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(
      sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([48, 52, 50, 53, 52, 55]);
  });

  it.each([
    ["ascending", [48, 52]],
    ["descending", [52, 48]],
    ["up-down", [48, 52, 48]],
  ] as const)(
    "plays separate interval notes with an %s inner contour",
    (intervalDirection, expectedMidi) => {
      const sequence = createExerciseSequence({
        end: { octave: 0, stepOffset: 0 },
        noteCollectionKey: "ionian",
        pattern: {
          direction: "ascending",
          extensionDegree: 5,
          extensionDirection: "up-down",
          intervalDegree: 3,
          intervalDirection,
          mode: "interval",
          notePlayback: "separate",
        },
        rootNote: "C",
      });

      expect(
        sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
      ).toEqual(expectedMidi);
    },
  );

  it("plays interval notes together on one beat", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 2 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "interval",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(
      sequence.steps.map((step) => step.notes.map((note) => note.midi)),
    ).toEqual([
      [48, 52],
      [50, 53],
      [52, 55],
    ]);
  });

  it("creates cumulative thirteenth stacks without chord tables", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "melodicMinor",
      pattern: {
        direction: "ascending",
        extensionDegree: 13,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(
      sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([48, 51, 55, 59, 62, 65, 69]);
    expect(sequence.supportsTertianExercises).toBe(true);
  });

  it("describes each Ionian chord from its relative modal root", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 3 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 13,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(sequence.chordDescriptorsByAnchorPosition.get(0)).toEqual({
      chordName: "CM7 (9, 11, 13)",
      collectionPositions: [0, 2, 4, 6, 8, 10, 12],
      intervals: ["1", "3", "5", "7", "9", "11", "13"],
      midiNotes: [48, 52, 55, 59, 62, 65, 69],
      relativeCollectionKey: "ionian",
      rootName: "C",
    });
    expect(sequence.chordDescriptorsByAnchorPosition.get(1)).toMatchObject({
      chordName: "Dm7 (9, 11, 13)",
      intervals: ["1", "♭3", "5", "♭7", "9", "11", "13"],
      relativeCollectionKey: "dorian",
      rootName: "D",
    });
    expect(sequence.chordDescriptorsByAnchorPosition.get(2)).toMatchObject({
      chordName: "Em7 (♭9, 11, ♭13)",
      intervals: ["1", "♭3", "5", "♭7", "♭9", "11", "♭13"],
      relativeCollectionKey: "phrygian",
      rootName: "E",
    });
    expect(sequence.chordDescriptorsByAnchorPosition.get(3)).toMatchObject({
      chordName: "FM7 (9, ♯11, 13)",
      intervals: ["1", "3", "5", "7", "9", "♯11", "13"],
      relativeCollectionKey: "lydian",
      rootName: "F",
    });
  });

  it("continues through the parent mode family from a Dorian base", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "dorian",
      pattern: {
        direction: "ascending",
        extensionDegree: 13,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "D",
    });

    expect(sequence.chordDescriptorsByAnchorPosition.get(0)).toMatchObject({
      chordName: "Dm7 (9, 11, 13)",
      intervals: ["1", "♭3", "5", "♭7", "9", "11", "13"],
      relativeCollectionKey: "dorian",
      rootName: "D",
    });
    expect(sequence.chordDescriptorsByAnchorPosition.get(1)).toMatchObject({
      chordName: "Em7 (♭9, 11, ♭13)",
      intervals: ["1", "♭3", "5", "♭7", "♭9", "11", "♭13"],
      relativeCollectionKey: "phrygian",
      rootName: "E",
    });
  });

  it("uses the relative harmonic-minor mode and selected chord size", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "phrygianDominant",
      pattern: {
        direction: "ascending",
        extensionDegree: 11,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(sequence.chordDescriptorsByAnchorPosition.get(1)).toMatchObject({
      chordName: "D♭M7 (♯9, ♯11)",
      intervals: ["1", "3", "5", "7", "♯9", "♯11"],
      relativeCollectionKey: "lydianSharp2",
      rootName: "D♭",
    });
  });

  it("uses exact package chord names when the complete formula exists", () => {
    const majorNinth = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 9,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });
    const dominantThirteenth = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "mixolydian",
      pattern: {
        direction: "ascending",
        extensionDegree: 13,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "G",
    });

    expect(majorNinth.chordDescriptorsByAnchorPosition.get(0)?.chordName).toBe(
      "CM9",
    );
    expect(
      dominantThirteenth.chordDescriptorsByAnchorPosition.get(0)?.chordName,
    ).toBe("G13");
  });

  it("describes melodic-minor extensions conservatively", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "altered",
      pattern: {
        direction: "ascending",
        extensionDegree: 13,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(sequence.chordDescriptorsByAnchorPosition.get(0)).toMatchObject({
      chordName: "Cø7 (♭9, ♭11, ♭13)",
      intervals: ["1", "♭3", "♭5", "♭7", "♭9", "♭11", "♭13"],
      relativeCollectionKey: "altered",
      rootName: "C",
    });
  });

  it("plays chord notes together on one beat", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "descending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(
      sequence.steps.map((step) => step.notes.map((note) => note.midi)),
    ).toEqual([[48, 52, 55]]);
    expect(sequence.chordDescriptorsByAnchorPosition.get(0)?.chordName).toBe(
      "CM",
    );
  });

  it("applies direction to interval and extension patterns", () => {
    const intervalSequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 2 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "descending",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "ascending",
        mode: "interval",
        notePlayback: "separate",
      },
      rootNote: "C",
    });
    const extensionSequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 2 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "up-down",
        extensionDegree: 5,
        extensionDirection: "up-down",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(
      intervalSequence.steps.flatMap((step) =>
        step.notes.map((note) => note.midi),
      ),
    ).toEqual([52, 55, 50, 53, 48, 52]);
    expect(
      extensionSequence.steps.flatMap((step) =>
        step.notes.map((note) => note.midi),
      ),
    ).toEqual([
      48, 52, 55, 52, 48, 50, 53, 57, 53, 50, 52, 55, 59, 55, 52, 50, 53, 57,
      53, 50,
    ]);
  });

  it("applies descending direction within each extension", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 5,
        extensionDirection: "descending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(
      sequence.steps.flatMap((step) => step.notes.map((note) => note.midi)),
    ).toEqual([55, 52, 48, 57, 53, 50]);
  });

  it("does not advertise tertian exercises for chromatic collections", () => {
    expect(
      createExerciseSequence({
        noteCollectionKey: "chromatic",
      }).supportsTertianExercises,
    ).toBe(false);
  });

  it.each(["ionian", "phrygianDominant", "altered"] as const)(
    "supports scale-degree exercises for %s",
    (noteCollectionKey) => {
      expect(
        createExerciseSequence({
          noteCollectionKey,
        }).supportsScaleDegreeExercises,
      ).toBe(true);
    },
  );

  it.each(["bluesPentatonic", "chromatic", "dominant13"] as const)(
    "does not support scale-degree exercises for %s",
    (noteCollectionKey) => {
      expect(
        createExerciseSequence({
          noteCollectionKey,
        }).supportsScaleDegreeExercises,
      ).toBe(false);
    },
  );
});

describe("exercise labels", () => {
  it("formats interval choices", () => {
    expect(getExerciseIntervalLabel(3)).toBe("3rd");
    expect(getExerciseIntervalLabel(11)).toBe("11th");
  });
});
