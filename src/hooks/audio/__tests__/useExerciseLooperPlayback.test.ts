import { describe, expect, it } from "vitest";
import { getExerciseVisualStepLeadSeconds } from "@/hooks/audio/useExerciseLooperPlayback";
import { type ExercisePlaybackEvent } from "@/audio";

function createEvent(
  durationBeats: number,
  offsetBeats = 0,
): ExercisePlaybackEvent {
  return {
    durationBeats,
    midi: 60,
    offsetBeats,
    stepIndex: 0,
  };
}

describe("getExerciseVisualStepLeadSeconds", () => {
  it("does not lead an empty exercise", () => {
    expect(getExerciseVisualStepLeadSeconds([], 120)).toBe(0);
  });

  it("uses the target visual lead for ordinary step durations", () => {
    expect(getExerciseVisualStepLeadSeconds([createEvent(1)], 120)).toBe(0.02);
  });

  it("caps the lead for very short fast-tempo steps", () => {
    const lead = getExerciseVisualStepLeadSeconds([createEvent(0.25)], 300);

    expect(lead).toBeCloseTo(0.0175);
  });

  it("uses the shortest event duration when a pattern has mixed durations", () => {
    const lead = getExerciseVisualStepLeadSeconds(
      [createEvent(1), createEvent(0.125, 1)],
      300,
    );

    expect(lead).toBeCloseTo(0.00875);
  });
});
