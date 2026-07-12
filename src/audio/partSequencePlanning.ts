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
import {
  resolvePartBackingBand,
  type ResolvedPartBackingBand,
} from "@/utils/music-part/resolvePartBackingBand";
import { getRhythmSelectionPattern } from "@/utils/rhythm/rhythmConfig";
import {
  type ExerciseLooperPartModuleConfig,
  type MusicPartConfig,
  type SessionConfig,
  type SessionBackingBandConfig,
} from "@/types/session";
import { getSessionBackingBandConfig } from "@/utils/session/sessionBackingBand";
import {
  createExercisePlaybackRequest,
  getExercisePlaybackCycleDurationBeats,
} from "./exercisePlaybackRequest";
import { type ExercisePlaybackRequest } from "./exercisePlaybackCoordinator";
import { type RhythmPlaybackRequest } from "./rhythmPlaybackCoordinator";
import { type BeatTransportCountIn } from "./beatTransportCoordinator";

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
  countIn: BeatTransportCountIn;
  contentSignature: string;
  mode: "session" | "part-loop";
  partResetSignatures: readonly string[];
  parts: readonly PartSequenceStepPlan[];
  sessionId: string;
  signature: string;
  sourceSignature: string;
  tempoBpm: number;
  updateSignature: string;
}

export interface PartSequencePlaybackPlanOptions {
  mode?: "session" | "part-loop";
  partId?: string;
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
  automaticLooper,
  metronomeEnabled,
  module,
  part,
  tempoBpm,
}: {
  automaticLooper?: SessionBackingBandConfig["looper"];
  metronomeEnabled: boolean;
  module: ExerciseLooperPartModuleConfig | undefined;
  part: MusicPartConfig;
  tempoBpm: number;
}) {
  const sequence = getEffectiveExercisePattern({
    end: module?.end,
    noteCollectionKey: part.noteCollectionKey,
    octaveOffset: module?.octaveOffset ?? automaticLooper?.octaveOffset,
    pattern: module?.pattern ?? DEFAULT_EXERCISE_PATTERN,
    rootNote: part.rootNote,
    start: module?.start,
  });
  const request = createExercisePlaybackRequest({
    audioPresetId: module?.audioPresetId ?? automaticLooper?.audioPresetId,
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
  resolvedBand: ResolvedPartBackingBand,
) {
  if (!resolvedBand.backingNotes.enabled) {
    return [];
  }

  const selectedModule = resolvedBand.backingNotes.module;
  if (!selectedModule) {
    const request = createExerciseRequest({
      automaticLooper: resolvedBand.session.looper,
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
  part,
  resolvedBand,
  tempoBpm,
}: {
  part: MusicPartConfig;
  resolvedBand: ResolvedPartBackingBand;
  tempoBpm: number;
}): RhythmPlaybackRequest {
  const selectedRhythmModule = resolvedBand.rhythm.module;

  return {
    id:
      selectedRhythmModule?.id ??
      `${PART_SEQUENCE_DEFAULT_RHYTHM_ID_PREFIX}:${part.id}`,
    pattern: getRhythmSelectionPattern(resolvedBand.rhythm.selection),
    tempoBpm,
  };
}

function createRhythmRequestsForPart(
  part: MusicPartConfig,
  tempoBpm: number,
  resolvedBand: ResolvedPartBackingBand,
) {
  if (!resolvedBand.rhythm.enabled) {
    return [];
  }

  return [
    createRhythmRequest({
      part,
      resolvedBand,
      tempoBpm,
    }),
  ];
}

function getPartCountIn(
  part: MusicPartConfig | undefined,
  backingBand: SessionBackingBandConfig,
) {
  if (!part || backingBand.countInBeats === 0) {
    return { durationBeats: 0, pulses: 0 };
  }

  return {
    durationBeats: backingBand.countInBeats,
    pulses: backingBand.countInBeats,
  };
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

function createSourceSignature(
  session: SessionConfig,
  mode: PartSequencePlaybackPlan["mode"],
  parts: readonly PartSequenceStepPlan[],
) {
  return JSON.stringify({
    mode,
    sessionId: session.id,
    parts: parts.map((part) => ({ partId: part.partId })),
  });
}

export function createPartSequencePlaybackPlan(
  session: SessionConfig,
  options: PartSequencePlaybackPlanOptions = {},
): PartSequencePlaybackPlan {
  const tempoBpm = session.tempoBpm ?? 80;
  const backingBand = getSessionBackingBandConfig(session.backingBand);
  const mode = options.mode ?? "session";
  const selectedParts =
    mode === "part-loop"
      ? session.parts.filter((part) => part.id === options.partId)
      : session.parts;
  const parts = selectedParts.map((part): PartSequenceStepPlan => {
    const index = session.parts.findIndex(
      (candidate) => candidate.id === part.id,
    );
    const resolvedBand = resolvePartBackingBand(part, backingBand);
    const durationBeats = resolvedBand.durationBeats;
    const exerciseRequests = createExerciseRequestsForPart(
      part,
      tempoBpm,
      resolvedBand,
    );
    const rhythmRequests = createRhythmRequestsForPart(
      part,
      tempoBpm,
      resolvedBand,
    );
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
  const sourceSignature = createSourceSignature(session, mode, parts);
  const updateSignature = createUpdateSignature(parts);

  return {
    countIn: getPartCountIn(selectedParts[0], backingBand),
    contentSignature,
    mode,
    partResetSignatures: parts.map((part) => part.resetSignature),
    parts,
    sessionId: session.id,
    signature: `${tempoBpm}:${contentSignature}`,
    sourceSignature,
    tempoBpm,
    updateSignature: `${tempoBpm}:${updateSignature}`,
  };
}
