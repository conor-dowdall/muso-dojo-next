import {
  DEFAULT_EXERCISE_METRONOME_ENABLED,
  DEFAULT_EXERCISE_OCTAVE_OFFSET,
  DEFAULT_EXERCISE_PATTERN,
  DEFAULT_EXERCISE_START,
  DEFAULT_EXERCISE_SUBDIVISION,
  exercisePatternsAreEqual,
} from "@/utils/exercise-looper/exerciseConfig";
import {
  createExerciseSequence,
  type ExercisePattern,
} from "@/utils/exercise-looper/exerciseSequence";
import { getPartLengthBeats } from "@/utils/music-part/partLength";
import {
  getPartBandModule,
  getPartBandSource,
} from "@/utils/music-part/partBand";
import { getAutomaticRhythmSelection } from "@/utils/rhythm/automaticRhythm";
import { getRhythmSelectionPattern } from "@/utils/rhythm/rhythmConfig";
import {
  type ExerciseLooperPartModuleConfig,
  type MusicPartConfig,
  type RhythmPartModuleConfig,
  type SessionConfig,
} from "@/types/session";
import {
  createExercisePlaybackRequest,
  getExercisePlaybackCycleDurationBeats,
} from "./exercisePlaybackRequest";
import { type ExercisePlaybackRequest } from "./exercisePlaybackCoordinator";
import { type RhythmPlaybackRequest } from "./rhythmPlaybackCoordinator";

const PART_SEQUENCE_DEFAULT_EXERCISE_ID_PREFIX = "part-sequence-looper";
const PART_SEQUENCE_DEFAULT_RHYTHM_ID_PREFIX = "part-sequence-drums";

export interface PartSequenceStepPlan {
  durationBeats: number;
  exerciseRequests: readonly ExercisePlaybackRequest[];
  index: number;
  partId: string;
  resetSignature: string;
  rhythmRequests: readonly RhythmPlaybackRequest[];
  updateSignature: string;
}

export interface PartSequencePlaybackPlan {
  contentSignature: string;
  partResetSignatures: readonly string[];
  parts: readonly PartSequenceStepPlan[];
  sessionId: string;
  signature: string;
  sourceSignature: string;
  tempoBpm: number;
  updateSignature: string;
}

function getEffectiveExercisePattern({
  end,
  noteCollectionKey,
  octaveOffset = DEFAULT_EXERCISE_OCTAVE_OFFSET,
  pattern = DEFAULT_EXERCISE_PATTERN,
  rootNote,
  start = DEFAULT_EXERCISE_START,
}: {
  end: ExerciseLooperPartModuleConfig["end"];
  noteCollectionKey: MusicPartConfig["noteCollectionKey"];
  octaveOffset: ExerciseLooperPartModuleConfig["octaveOffset"];
  pattern: ExercisePattern;
  rootNote: MusicPartConfig["rootNote"];
  start: ExerciseLooperPartModuleConfig["start"];
}) {
  const requestedSequence = createExerciseSequence({
    end,
    noteCollectionKey,
    octaveOffset,
    pattern,
    rootNote,
    start,
  });
  const effectivePattern =
    requestedSequence.supportsScaleDegreeExercises || pattern.mode === "single"
      ? pattern
      : { ...pattern, mode: "single" as const };

  return exercisePatternsAreEqual(effectivePattern, pattern)
    ? requestedSequence
    : createExerciseSequence({
        end,
        noteCollectionKey,
        octaveOffset,
        pattern: effectivePattern,
        rootNote,
        start,
      });
}

function createExerciseRequest({
  metronomeEnabled,
  module,
  part,
  tempoBpm,
}: {
  metronomeEnabled: boolean;
  module: ExerciseLooperPartModuleConfig | undefined;
  part: MusicPartConfig;
  tempoBpm: number;
}) {
  const sequence = getEffectiveExercisePattern({
    end: module?.end,
    noteCollectionKey: part.noteCollectionKey,
    octaveOffset: module?.octaveOffset,
    pattern: module?.pattern ?? DEFAULT_EXERCISE_PATTERN,
    rootNote: part.rootNote,
    start: module?.start,
  });
  const request = createExercisePlaybackRequest({
    audioPresetId: module?.audioPresetId,
    countInBeats: 0,
    id: module?.id ?? `${PART_SEQUENCE_DEFAULT_EXERCISE_ID_PREFIX}:${part.id}`,
    metronomeEnabled,
    steps: sequence.steps,
    subdivision: module?.subdivision ?? DEFAULT_EXERCISE_SUBDIVISION,
    tempoBpm,
  });

  return getExercisePlaybackCycleDurationBeats(request.events) > 0
    ? request
    : undefined;
}

function createExerciseRequestsForPart(
  part: MusicPartConfig,
  tempoBpm: number,
) {
  const source = getPartBandSource(part, "backingNotes");

  if (source.mode === "off") {
    return [];
  }

  const selectedModule = getPartBandModule(part, "backingNotes");
  if (!selectedModule || selectedModule.type !== "exercise-looper") {
    const request = createExerciseRequest({
      metronomeEnabled: DEFAULT_EXERCISE_METRONOME_ENABLED,
      module: undefined,
      part,
      tempoBpm,
    });
    return request ? [request] : [];
  }

  const request = createExerciseRequest({
    metronomeEnabled:
      selectedModule.metronomeEnabled ?? DEFAULT_EXERCISE_METRONOME_ENABLED,
    module: selectedModule,
    part,
    tempoBpm,
  });

  return request ? [request] : [];
}

function createRhythmRequest({
  module,
  part,
  tempoBpm,
}: {
  module: RhythmPartModuleConfig | undefined;
  part: MusicPartConfig;
  tempoBpm: number;
}): RhythmPlaybackRequest {
  const lengthBeats = getPartLengthBeats(part);
  const selection =
    module?.rhythm ??
    getAutomaticRhythmSelection(part.automaticRhythm, lengthBeats);

  return {
    id: module?.id ?? `${PART_SEQUENCE_DEFAULT_RHYTHM_ID_PREFIX}:${part.id}`,
    pattern: getRhythmSelectionPattern(selection),
    tempoBpm,
  };
}

function createRhythmRequestsForPart(part: MusicPartConfig, tempoBpm: number) {
  const source = getPartBandSource(part, "rhythm");
  if (source.mode === "off") {
    return [];
  }

  const selectedModule = getPartBandModule(part, "rhythm");

  return [
    createRhythmRequest({
      module: selectedModule?.type === "rhythm" ? selectedModule : undefined,
      part,
      tempoBpm,
    }),
  ];
}

function createExerciseResetSignature(request: ExercisePlaybackRequest) {
  return {
    events: request.events,
    id: request.id,
    presetId: request.presetId,
  };
}

function createRhythmResetSignature(request: RhythmPlaybackRequest) {
  return {
    cycleTicks: request.pattern.cycleTicks,
    meter: request.pattern.meter,
    swing: request.pattern.swing,
  };
}

function createPartResetSignature({
  durationBeats,
  exerciseRequests,
  rhythmRequests,
}: Pick<
  PartSequenceStepPlan,
  "durationBeats" | "exerciseRequests" | "rhythmRequests"
>) {
  return JSON.stringify({
    durationBeats,
    exercises: exerciseRequests.map(createExerciseResetSignature),
    rhythms: rhythmRequests.map(createRhythmResetSignature),
  });
}

function createPartUpdateSignature({
  durationBeats,
  exerciseRequests,
  rhythmRequests,
}: Pick<
  PartSequenceStepPlan,
  "durationBeats" | "exerciseRequests" | "rhythmRequests"
>) {
  return JSON.stringify({
    durationBeats,
    exercises: exerciseRequests.map((request) => ({
      ...request,
      tempoBpm: undefined,
    })),
    rhythms: rhythmRequests.map((request) => ({
      ...request,
      tempoBpm: undefined,
    })),
  });
}

function createContentSignature(parts: readonly PartSequenceStepPlan[]) {
  return JSON.stringify(
    parts.map((part) => ({
      partId: part.partId,
      resetSignature: part.resetSignature,
    })),
  );
}

function createUpdateSignature(parts: readonly PartSequenceStepPlan[]) {
  return JSON.stringify(
    parts.map((part) => ({
      partId: part.partId,
      updateSignature: part.updateSignature,
    })),
  );
}

function createSourceSignature(session: SessionConfig) {
  return JSON.stringify(session.parts.map((part) => ({ partId: part.id })));
}

export function createPartSequencePlaybackPlan(
  session: SessionConfig,
): PartSequencePlaybackPlan {
  const tempoBpm = session.tempoBpm ?? 80;
  const parts = session.parts.map((part, index): PartSequenceStepPlan => {
    const durationBeats = getPartLengthBeats(part);
    const exerciseRequests = createExerciseRequestsForPart(part, tempoBpm);
    const rhythmRequests = createRhythmRequestsForPart(part, tempoBpm);
    const signatureInput = {
      durationBeats,
      exerciseRequests,
      rhythmRequests,
    };

    return {
      ...signatureInput,
      index,
      partId: part.id,
      resetSignature: createPartResetSignature(signatureInput),
      updateSignature: createPartUpdateSignature(signatureInput),
    };
  });
  const contentSignature = createContentSignature(parts);
  const sourceSignature = createSourceSignature(session);
  const updateSignature = createUpdateSignature(parts);

  return {
    contentSignature,
    partResetSignatures: parts.map((part) => part.resetSignature),
    parts,
    sessionId: session.id,
    signature: `${tempoBpm}:${contentSignature}`,
    sourceSignature,
    tempoBpm,
    updateSignature: `${tempoBpm}:${updateSignature}`,
  };
}
