import { describe, expect, it } from "vitest";
import { createExerciseSequence } from "@/utils/exercise-looper/exerciseSequence";
import { resolveExerciseStudyDisplay } from "@/utils/exercise-looper/exerciseStudyDisplay";

describe("resolveExerciseStudyDisplay", () => {
  it("shows one complete scale octave in single-note mode", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 0 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        mode: "single",
        sequence,
      }),
    ).toEqual({
      intervals: ["1", "2", "3", "4", "5", "6", "7", "8"],
      kind: "notes",
      notes: ["C", "D", "E", "F", "G", "A", "B", "C"],
    });
  });

  it("does not add an octave to a chord collection in single-note mode", () => {
    const sequence = createExerciseSequence({
      noteCollectionKey: "major7",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        mode: "single",
        sequence,
      }),
    ).toEqual({
      intervals: ["1", "3", "5", "7"],
      kind: "notes",
      notes: ["C", "E", "G", "B"],
    });
  });

  it("shows the focused interval while idle", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "interval",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        focusedAnchorPosition: 0,
        mode: "interval",
        sequence,
      }),
    ).toEqual({
      intervals: ["1", "3"],
      kind: "notes",
      notes: ["C", "E"],
    });
  });

  it("prefers the sounding interval over the focused interval", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "descending",
        mode: "interval",
        notePlayback: "separate",
      },
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        activeAnchorPosition: 1,
        focusedAnchorPosition: 0,
        mode: "interval",
        sequence,
      }),
    ).toEqual({
      intervals: ["1", "♭3"],
      kind: "notes",
      notes: ["D", "F"],
    });
  });

  it("retains compound interval numbers relative to the anchor", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 10,
        intervalDirection: "ascending",
        mode: "interval",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        focusedAnchorPosition: 1,
        mode: "interval",
        sequence,
      }),
    ).toEqual({
      intervals: ["1", "♭10"],
      kind: "notes",
      notes: ["D", "F"],
    });
  });

  it("keeps the package chord name and chord-relative intervals", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      pattern: {
        direction: "ascending",
        extensionDegree: 7,
        extensionDirection: "ascending",
        intervalDegree: 3,
        intervalDirection: "up-down",
        mode: "extension",
        notePlayback: "together",
      },
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        focusedAnchorPosition: 0,
        mode: "extension",
        sequence,
      }),
    ).toEqual({
      chordName: "CM7",
      intervals: ["1", "3", "5", "7"],
      kind: "chord",
      notes: ["C", "E", "G", "B"],
    });
  });
});
