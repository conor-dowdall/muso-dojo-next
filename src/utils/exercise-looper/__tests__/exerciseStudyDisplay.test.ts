import { describe, expect, it } from "vitest";
import { createExerciseSequence } from "@/utils/exercise-looper/exerciseSequence";
import {
  resolveExerciseStudyAnchorPosition,
  resolveExerciseStudyDisplay,
} from "@/utils/exercise-looper/exerciseStudyDisplay";

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

  it("shows the selected interval while idle", () => {
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
        selectedAnchorPosition: 0,
        mode: "interval",
        sequence,
      }),
    ).toEqual({
      intervals: ["1", "3"],
      kind: "notes",
      notes: ["C", "E"],
    });
  });

  it("prefers the sounding interval over the selected interval", () => {
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
        selectedAnchorPosition: 0,
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
        selectedAnchorPosition: 1,
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
        selectedAnchorPosition: 0,
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

  it("preserves the selected collection position when the collection changes", () => {
    const pattern = {
      direction: "ascending",
      extensionDegree: 7,
      extensionDirection: "ascending",
      intervalDegree: 3,
      intervalDirection: "ascending",
      mode: "interval",
      notePlayback: "together",
    } as const;
    const selectedAnchorPosition = 0;
    const ionian = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      pattern,
      rootNote: "C",
    });
    const dorian = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "dorian",
      pattern,
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyDisplay({
        mode: "interval",
        selectedAnchorPosition,
        sequence: ionian,
      }),
    ).toEqual({
      intervals: ["1", "3"],
      kind: "notes",
      notes: ["C", "E"],
    });
    expect(
      resolveExerciseStudyDisplay({
        mode: "interval",
        selectedAnchorPosition,
        sequence: dorian,
      }),
    ).toEqual({
      intervals: ["1", "♭3"],
      kind: "notes",
      notes: ["C", "E♭"],
    });
  });

  it("normalizes an unavailable selected anchor to the root anchor", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchorPosition: 12,
        sequence,
      }),
    ).toBe(0);
  });

  it("falls back from an unavailable sounding anchor to the selected anchor", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyAnchorPosition({
        activeAnchorPosition: 12,
        selectedAnchorPosition: 1,
        sequence,
      }),
    ).toBe(1);
  });
});
