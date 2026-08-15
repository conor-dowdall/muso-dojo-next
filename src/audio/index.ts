export { createWebAudioEngine, musoAudioEngine } from "./createWebAudioEngine";
export {
  isAudioPlaybackActive,
  stopAllAudioPlayback,
  stopTransportPlayback,
} from "./stopAllAudioPlayback";
export {
  audioWorkspaceScopesAreEqual,
  WorkspaceAudioTransitionPolicy,
  type AudioWorkspaceIdentity,
  type AudioWorkspaceScope,
} from "./workspaceAudioTransitionPolicy";
export {
  audioReadiness,
  createAudioReadinessController,
  ensureAudioReady,
  type AudioReadinessSnapshot,
  type AudioReadinessStatus,
  type EnsureAudioReadyOptions,
} from "./audioReadiness";
export {
  createLookaheadScheduler,
  getLookaheadSchedulerDiagnostics,
  resetLookaheadSchedulerDiagnostics,
  type LookaheadScheduler,
  type LookaheadSchedulerDiagnostics,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
export {
  createExercisePlaybackEvents,
  createExercisePlaybackRequest,
  getExercisePlaybackCycleDurationBeats,
} from "./exercisePlaybackRequest";
export {
  type ArrangementStepContext,
  createPartSequencePlaybackPlan,
  createSessionPlaybackRequestFromPart,
  createPartSequenceTempoSignature,
  type PartSequenceStartOptions,
  type PlaybackCompletionPolicy,
  type PlaybackSequenceOwner,
  type PartSequencePlaybackPlan,
  type PartSequencePlaybackPlanOptions,
  type PartSequenceStepPlan,
} from "./partSequencePlanning";
export {
  createArrangementPlaybackRequest,
  createArrangementPlaybackRequestFromEntry,
  createArrangementEntryLoopPlaybackRequest,
  type ArrangementPlaybackRequest,
} from "./arrangementPlaybackPlanning";
export {
  partSequenceCoordinator,
  PartSequenceCoordinator,
  type PartSequenceSnapshot,
  type PartSequenceStopOptions,
} from "./partSequenceCoordinator";
export {
  getPartSequencePlanReconciliation,
  type PartSequencePlanReconciliation,
} from "./partSequenceReconciliation";
export {
  beatTransportCoordinator,
  BeatTransportCoordinator,
  type BeatTransportCountIn,
  type BeatTransportPartStartRequest,
  type BeatTransportStartSource,
} from "./beatTransportCoordinator";
export {
  exercisePlaybackRestartRequestsAreEqual,
  getExercisePlaybackOwner,
  exercisePlaybackCoordinator,
  isExercisePlaybackActive,
  type ExercisePlaybackEvent,
  type ExercisePlaybackRequest,
  type ExercisePlaybackSnapshot,
} from "./exercisePlaybackCoordinator";
export {
  getRhythmPlaybackOwner,
  isRhythmPlaybackActive,
  rhythmPatternsAreEqual,
  rhythmPlaybackCoordinator,
  type RhythmPlaybackRequest,
  type RhythmPlaybackSnapshot,
} from "./rhythmPlaybackCoordinator";
export { type PlaybackOwner } from "./playbackOwnership";
export {
  ExerciseAuditionController,
  type ExerciseAuditionAudioEngine,
  type ExerciseAuditionNote,
  type ExerciseAuditionRequest,
} from "./exerciseAuditionController";
export {
  presetAuditionController,
  PresetAuditionController,
  type PresetAuditionAudioEngine,
  type PresetAuditionRequest,
} from "./presetAuditionController";
export {
  DEFAULT_CONCERT_PITCH_HZ,
  MIDI_A4,
  MIDI_MAX,
  MIDI_MIN,
  MUSICAL_SURFACE_MIDI_MAX,
  MUSICAL_SURFACE_MIDI_MIN,
  isMusicalSurfaceMidiNote,
  isPlayableMidiNote,
  midiToFrequency,
} from "./pitch";
export {
  audioPresets,
  defaultAudioPresetIds,
  getAudioPresetsForSurface,
  getDefaultAudioPresetId,
  isAudioPresetId,
  isAudioPresetAvailableOn,
  resolveAudioPreset,
} from "./presets";
export type {
  AudioEngine,
  AudioPreset,
  AudioPresetId,
  AudioPresetSurface,
  AudioUse,
  AudioVoiceHandle,
  AudioClockSnapshot,
  DroneHandle,
  DroneNoteRequest,
  DroneRequest,
  PlayNoteRequest,
  PlaybackGroupHandle,
  SampleEnvelopeConfig,
  SamplePackId,
  ScheduleMetronomeClickRequest,
  ScheduleNoteRequest,
  SchedulePercussionHitRequest,
} from "./types";
