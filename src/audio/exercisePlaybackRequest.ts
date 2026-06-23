import { exerciseSubdivisionBeats } from "@/utils/exercise-looper/exerciseConfig";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";
import {
  type ExerciseCountInBeats,
  type ExerciseSubdivision,
} from "@/types/session";
import { type AudioPresetId } from "./types";
import { getDefaultAudioPresetId } from "./presets";
import {
  type ExercisePlaybackEvent,
  type ExercisePlaybackRequest,
} from "./exercisePlaybackCoordinator";

export function createExercisePlaybackEvents(
  steps: readonly ExerciseSequenceStep[],
  subdivision: ExerciseSubdivision,
) {
  const subdivisionBeats = exerciseSubdivisionBeats[subdivision];
  let offsetBeats = 0;
  const events: ExercisePlaybackEvent[] = [];

  steps.forEach((step, stepIndex) => {
    const durationBeats = step.durationUnits * subdivisionBeats;

    step.notes.forEach((note) => {
      events.push({
        durationBeats,
        midi: note.midi,
        offsetBeats,
        stepIndex,
      });
    });
    offsetBeats += durationBeats;
  });

  return events;
}

export function getExercisePlaybackCycleDurationBeats(
  events: readonly ExercisePlaybackEvent[],
) {
  return events.reduce(
    (duration, event) =>
      Math.max(duration, event.offsetBeats + event.durationBeats),
    0,
  );
}

export function createExercisePlaybackRequest({
  audioPresetId,
  countInBeats = 0,
  id,
  metronomeEnabled,
  steps,
  subdivision,
  tempoBpm,
}: {
  audioPresetId?: AudioPresetId;
  countInBeats?: ExerciseCountInBeats;
  id: string;
  metronomeEnabled: boolean;
  steps: readonly ExerciseSequenceStep[];
  subdivision: ExerciseSubdivision;
  tempoBpm: number;
}): ExercisePlaybackRequest {
  return {
    countInBeats,
    events: createExercisePlaybackEvents(steps, subdivision),
    id,
    metronomeEnabled,
    presetId: audioPresetId ?? getDefaultAudioPresetId("exercise"),
    tempoBpm,
  };
}
