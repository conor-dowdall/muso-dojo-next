import { describe, expect, it } from "vitest";
import { createExerciseSequence } from "@/utils/exercise-looper/exerciseSequence";
import { resolveExerciseStudyChordDescriptor } from "@/utils/exercise-looper/exerciseStudyDisplay";

describe("resolveExerciseStudyChordDescriptor", () => {
  const descriptors = createExerciseSequence({
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
  }).chordDescriptorsByAnchorPosition;
  const focusedChordDescriptor = descriptors.get(0);
  const activeChordDescriptor = descriptors.get(1);

  it("uses the package seventh-chord name", () => {
    expect(focusedChordDescriptor?.chordName).toBe("CM7");
  });

  it("prefers the active loop chord over the focused chord", () => {
    expect(
      resolveExerciseStudyChordDescriptor({
        activeChordDescriptor,
        focusedChordDescriptor,
        mode: "extension",
      }),
    ).toBe(activeChordDescriptor);
  });

  it("uses the focused chord while chord playback is idle", () => {
    expect(
      resolveExerciseStudyChordDescriptor({
        focusedChordDescriptor,
        mode: "extension",
      }),
    ).toBe(focusedChordDescriptor);
  });

  it("does not expose chord study data in other modes", () => {
    expect(
      resolveExerciseStudyChordDescriptor({
        activeChordDescriptor,
        focusedChordDescriptor,
        mode: "interval",
      }),
    ).toBeUndefined();
  });
});
