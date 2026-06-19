import { describe, expect, it } from "vitest";
import {
  createExerciseSequence,
  type ExerciseSequence,
} from "@/utils/exercise-looper/exerciseSequence";
import {
  createExerciseStudyAnchorIdentity,
  resolveExerciseStudyAnchorPosition,
  resolveExerciseStudyDisplay,
} from "@/utils/exercise-looper/exerciseStudyDisplay";

function getAnchor(sequence: ExerciseSequence, collectionPosition: number) {
  const note = sequence.notes.find(
    (candidate) => candidate.collectionPosition === collectionPosition,
  );

  if (note === undefined) {
    throw new Error(`No exercise anchor at position ${collectionPosition}`);
  }

  return createExerciseStudyAnchorIdentity(sequence, note);
}

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
        selectedAnchor: getAnchor(sequence, 0),
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
        selectedAnchor: getAnchor(sequence, 0),
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
        selectedAnchor: getAnchor(sequence, 1),
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
        selectedAnchor: getAnchor(sequence, 0),
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
    const selectedAnchor = getAnchor(ionian, 0);

    expect(
      resolveExerciseStudyDisplay({
        mode: "interval",
        selectedAnchor,
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
        selectedAnchor,
        sequence: dorian,
      }),
    ).toEqual({
      intervals: ["1", "♭3"],
      kind: "notes",
      notes: ["C", "E♭"],
    });
  });

  it("remaps selected chord anchors by interval degree when changing to a scale", () => {
    const major = createExerciseSequence({
      noteCollectionKey: "major",
      rootNote: "C",
    });
    const ionian = createExerciseSequence({
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: getAnchor(major, 1),
        sequence: ionian,
      }),
    ).toBe(2);
    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: getAnchor(major, 2),
        sequence: ionian,
      }),
    ).toBe(4);
  });

  it("remaps same-sized collections by interval degree when their degree patterns differ", () => {
    const majorPentatonic = createExerciseSequence({
      noteCollectionKey: "majorPentatonic",
      rootNote: "C",
    });
    const major6Add9 = createExerciseSequence({
      noteCollectionKey: "major6Add9",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: getAnchor(majorPentatonic, 2),
        sequence: major6Add9,
      }),
    ).toBe(1);
    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: getAnchor(majorPentatonic, 1),
        sequence: major6Add9,
      }),
    ).toBe(0);
  });

  it("drops selected scale anchors when the degree is absent from a chord", () => {
    const ionian = createExerciseSequence({
      end: { octave: 1, stepOffset: 5 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });
    const major = createExerciseSequence({
      noteCollectionKey: "major",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: getAnchor(ionian, 8),
        sequence: major,
      }),
    ).toBe(0);
    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: getAnchor(ionian, 12),
        sequence: major,
      }),
    ).toBe(0);
  });

  it("normalizes an unavailable selected anchor to the root anchor", () => {
    const sequence = createExerciseSequence({
      end: { octave: 0, stepOffset: 1 },
      noteCollectionKey: "ionian",
      rootNote: "C",
    });

    expect(
      resolveExerciseStudyAnchorPosition({
        selectedAnchor: {
          collectionPosition: 12,
          collectionSize: sequence.collectionSize,
          intervalDegree: 13,
        },
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
        selectedAnchor: getAnchor(sequence, 1),
        sequence,
      }),
    ).toBe(1);
  });
});
