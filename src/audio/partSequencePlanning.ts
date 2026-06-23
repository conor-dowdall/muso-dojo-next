import {
  DEFAULT_RHYTHM_SELECTION,
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
  rhythmRequest?: RhythmPlaybackRequest;
}

export interface PartSequencePlaybackPlan {
  contentSignature: string;
  parts: readonly PartSequenceStepPlan[];
  sessionId: string;
  signature: string;
  sourceSignature: string;
  tempoBpm: number;
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

function createPlanSignature(parts: readonly PartSequenceStepPlan[]) {
  return JSON.stringify(
    parts.map((part) => ({
      durationBeats: part.durationBeats,
      exercise: part.exerciseRequest
        ? {
            ...part.exerciseRequest,
            tempoBpm: undefined,
          }
        : undefined,
      partId: part.partId,
      rhythm: part.rhythmRequest
        ? {
            ...part.rhythmRequest,
            tempoBpm: undefined,
          }
        : undefined,
    })),
  );
}

function createSourceSignature(session: SessionConfig) {
  return JSON.stringify(
    session.parts.map((part) => ({
      exercise: getFirstExerciseLooperModule(part) ?? undefined,
      noteCollectionKey: part.noteCollectionKey,
      partId: part.id,
      rhythm: getFirstRhythmModule(part) ?? undefined,
      rootNote: part.rootNote,
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
    const durationBeats =
      getRhythmModuleDurationBeats(rhythmModule) ??
      DEFAULT_SILENT_PART_DURATION_BEATS;

    return {
      durationBeats,
      ...(exerciseRequest ? { exerciseRequest } : {}),
      index,
      partId: part.id,
      ...(rhythmRequest ? { rhythmRequest } : {}),
    };
  });
  const contentSignature = createPlanSignature(parts);
  const sourceSignature = createSourceSignature(session);

  return {
    contentSignature,
    parts,
    sessionId: session.id,
    signature: `${tempoBpm}:${contentSignature}`,
    sourceSignature,
    tempoBpm,
  };
}
