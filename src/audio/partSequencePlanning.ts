import {
  DEFAULT_RHYTHM_SELECTION,
  getRhythmSelectionRecipe,
  getRhythmSelectionPattern,
} from "@/utils/rhythm/rhythmConfig";
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
import { resolvePracticeBandConfig } from "@/utils/practice-band/practiceBandConfig";
import {
  isExerciseLooperPartModule,
  isRhythmPartModule,
} from "@/utils/session/partModuleTypes";
import {
  type ExerciseLooperPartModuleConfig,
  type MusicPartConfig,
  type PracticeBandConfig,
  type RhythmPartModuleConfig,
  type SessionConfig,
} from "@/types/session";
import {
  createExercisePlaybackRequest,
  getExercisePlaybackCycleDurationBeats,
} from "./exercisePlaybackRequest";
import { type ExercisePlaybackRequest } from "./exercisePlaybackCoordinator";
import { type RhythmPlaybackRequest } from "./rhythmPlaybackCoordinator";

const DEFAULT_SILENT_PART_DURATION_BEATS = 4;
const PART_SEQUENCE_DEFAULT_EXERCISE_ID_PREFIX = "part-sequence-looper";
const PART_SEQUENCE_DEFAULT_RHYTHM_ID_PREFIX = "part-sequence-drums";

export interface PartSequenceStepPlan {
  durationBeats: number;
  exerciseRequest?: ExercisePlaybackRequest;
  index: number;
  partId: string;
  resetSignature: string;
  rhythmRequest?: RhythmPlaybackRequest;
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

function getFirstExerciseLooperModule(part: MusicPartConfig) {
  return part.modules.find(isExerciseLooperPartModule);
}

function getFirstRhythmModule(part: MusicPartConfig) {
  return part.modules.find(isRhythmPartModule);
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
    ? { pattern: effectivePattern, sequence: requestedSequence }
    : {
        pattern: effectivePattern,
        sequence: createExerciseSequence({
          end,
          noteCollectionKey,
          octaveOffset,
          pattern: effectivePattern,
          rootNote,
          start,
        }),
      };
}

function createExerciseRequestForPart({
  module,
  part,
  practiceBand,
  tempoBpm,
}: {
  module: ExerciseLooperPartModuleConfig | undefined;
  part: MusicPartConfig;
  practiceBand: PracticeBandConfig | undefined;
  tempoBpm: number;
}) {
  const resolvedPracticeBand = resolvePracticeBandConfig(practiceBand);

  if (!resolvedPracticeBand.backingNotes) {
    return undefined;
  }

  const octaveOffset =
    module?.octaveOffset ??
    (module
      ? DEFAULT_EXERCISE_OCTAVE_OFFSET
      : resolvedPracticeBand.octaveOffset);
  const { sequence } = getEffectiveExercisePattern({
    end: module?.end,
    noteCollectionKey: part.noteCollectionKey,
    octaveOffset,
    pattern: module?.pattern ?? DEFAULT_EXERCISE_PATTERN,
    rootNote: part.rootNote,
    start: module?.start,
  });
  const request = createExercisePlaybackRequest({
    audioPresetId:
      module?.audioPresetId ??
      (module ? undefined : resolvedPracticeBand.audioPresetId),
    countInBeats: 0,
    id: module?.id ?? `${PART_SEQUENCE_DEFAULT_EXERCISE_ID_PREFIX}:${part.id}`,
    metronomeEnabled:
      module?.metronomeEnabled ?? DEFAULT_EXERCISE_METRONOME_ENABLED,
    steps: sequence.steps,
    subdivision: module?.subdivision ?? DEFAULT_EXERCISE_SUBDIVISION,
    tempoBpm,
  });

  return getExercisePlaybackCycleDurationBeats(request.events) > 0
    ? request
    : undefined;
}

function createRhythmRequestForPart({
  module,
  part,
  practiceBand,
  tempoBpm,
}: {
  module: RhythmPartModuleConfig | undefined;
  part: MusicPartConfig;
  practiceBand: PracticeBandConfig | undefined;
  tempoBpm: number;
}) {
  if (!resolvePracticeBandConfig(practiceBand).drums) {
    return undefined;
  }

  return {
    id: module?.id ?? `${PART_SEQUENCE_DEFAULT_RHYTHM_ID_PREFIX}:${part.id}`,
    pattern: getRhythmSelectionPattern(
      module?.rhythm ?? DEFAULT_RHYTHM_SELECTION,
    ),
    tempoBpm,
  } satisfies RhythmPlaybackRequest;
}

function getRhythmModuleDurationBeats(
  module: RhythmPartModuleConfig | undefined,
) {
  if (!module) {
    return undefined;
  }

  const pattern = getRhythmSelectionPattern(module.rhythm);
  const cycleDuration = pattern.cycleTicks / pattern.ppq;

  return cycleDuration > 0 ? cycleDuration : undefined;
}

function createExerciseResetSignature(
  request: ExercisePlaybackRequest | undefined,
) {
  return request
    ? {
        events: request.events,
        id: request.id,
        presetId: request.presetId,
      }
    : undefined;
}

function createRhythmResetSignature(
  rhythm: RhythmPartModuleConfig["rhythm"] | undefined,
) {
  const recipe = getRhythmSelectionRecipe(rhythm ?? DEFAULT_RHYTHM_SELECTION);

  return {
    beats: recipe.beats,
    grouping: recipe.grouping,
    groove: recipe.groove,
  };
}

function createPartResetSignature({
  durationBeats,
  exerciseRequest,
  rhythm,
  rhythmRequest,
}: {
  durationBeats: number;
  exerciseRequest: ExercisePlaybackRequest | undefined;
  rhythm: RhythmPartModuleConfig["rhythm"] | undefined;
  rhythmRequest: RhythmPlaybackRequest | undefined;
}) {
  return JSON.stringify({
    durationBeats,
    exercise: createExerciseResetSignature(exerciseRequest),
    rhythm: rhythmRequest ? createRhythmResetSignature(rhythm) : undefined,
  });
}

function createPartUpdateSignature({
  durationBeats,
  exerciseRequest,
  rhythmRequest,
}: {
  durationBeats: number;
  exerciseRequest: ExercisePlaybackRequest | undefined;
  rhythmRequest: RhythmPlaybackRequest | undefined;
}) {
  return JSON.stringify({
    durationBeats,
    exercise: exerciseRequest
      ? {
          ...exerciseRequest,
          tempoBpm: undefined,
        }
      : undefined,
    rhythm: rhythmRequest
      ? {
          ...rhythmRequest,
          tempoBpm: undefined,
        }
      : undefined,
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
  return JSON.stringify(
    session.parts.map((part) => ({
      partId: part.id,
    })),
  );
}

export function createPartSequencePlaybackPlan(
  session: SessionConfig,
): PartSequencePlaybackPlan {
  const tempoBpm = session.tempoBpm ?? 80;
  const parts = session.parts.map((part, index): PartSequenceStepPlan => {
    const rhythmModule = getFirstRhythmModule(part);
    const exerciseRequest = createExerciseRequestForPart({
      module: getFirstExerciseLooperModule(part),
      part,
      practiceBand: session.practiceBand,
      tempoBpm,
    });
    const rhythmRequest = createRhythmRequestForPart({
      module: rhythmModule,
      part,
      practiceBand: session.practiceBand,
      tempoBpm,
    });
    const barDurationBeats =
      getRhythmModuleDurationBeats(rhythmModule) ??
      DEFAULT_SILENT_PART_DURATION_BEATS;
    const resetSignature = createPartResetSignature({
      durationBeats: barDurationBeats,
      exerciseRequest,
      rhythm: rhythmModule?.rhythm,
      rhythmRequest,
    });
    const updateSignature = createPartUpdateSignature({
      durationBeats: barDurationBeats,
      exerciseRequest,
      rhythmRequest,
    });

    return {
      durationBeats: barDurationBeats,
      ...(exerciseRequest ? { exerciseRequest } : {}),
      index,
      partId: part.id,
      resetSignature,
      ...(rhythmRequest ? { rhythmRequest } : {}),
      updateSignature,
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
