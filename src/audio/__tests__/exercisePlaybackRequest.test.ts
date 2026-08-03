import { describe, expect, it } from "vitest";
import {
  createExercisePlaybackEvents,
  createExercisePlaybackRequest,
  getExercisePlaybackCycleDurationBeats,
} from "@/audio/exercisePlaybackRequest";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";

const steps = [
  {
    durationUnits: 1,
    notes: [
      { anchorPosition: 0, collectionPosition: 0, midi: 60 },
      { anchorPosition: 0, collectionPosition: 2, midi: 64 },
    ],
  },
  {
    durationUnits: 2,
    notes: [{ anchorPosition: 1, collectionPosition: 4, midi: 67 }],
  },
] satisfies ExerciseSequenceStep[];

describe("exercise playback requests", () => {
  it("places chord tones together and advances later steps by subdivision", () => {
    const events = createExercisePlaybackEvents(steps, "2-per-beat");

    expect(events).toEqual([
      { durationBeats: 0.5, midi: 60, offsetBeats: 0, stepIndex: 0 },
      { durationBeats: 0.5, midi: 64, offsetBeats: 0, stepIndex: 0 },
      { durationBeats: 1, midi: 67, offsetBeats: 0.5, stepIndex: 1 },
    ]);
    expect(getExercisePlaybackCycleDurationBeats(events)).toBe(1.5);
  });

  it("preserves transport settings and supplies the default exercise preset", () => {
    expect(
      createExercisePlaybackRequest({
        countInBeats: 4,
        id: "exercise",
        metronomeEnabled: true,
        steps,
        subdivision: "2-per-beat",
        tempoBpm: 120,
      }),
    ).toMatchObject({
      countInBeats: 4,
      id: "exercise",
      metronomeEnabled: true,
      presetId: "plucked-string",
      tempoBpm: 120,
    });
  });
});
