export { createWebAudioEngine, musoAudioEngine } from "./createWebAudioEngine";
export { stopAllAudioPlayback } from "./stopAllAudioPlayback";
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
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
export {
  createExercisePlaybackEvents,
  createExercisePlaybackRequest,
  getExercisePlaybackCycleDurationBeats,
} from "./exercisePlaybackRequest";
export {
  createPartSequencePlaybackPlan,
  type PartSequencePlaybackPlan,
  type PartSequenceStepPlan,
} from "./partSequencePlanning";
export {
  partSequenceCoordinator,
  PartSequenceCoordinator,
  type PartSequenceSnapshot,
  type PartSequenceStopOptions,
} from "./partSequenceCoordinator";
export {
  beatTransportCoordinator,
  BeatTransportCoordinator,
  type BeatTransportPartStartRequest,
  type BeatTransportStartSource,
} from "./beatTransportCoordinator";
export {
  exercisePlaybackRestartRequestsAreEqual,
  exercisePlaybackCoordinator,
  isExercisePlaybackActive,
  type ExercisePlaybackEvent,
  type ExercisePlaybackRequest,
  type ExercisePlaybackSnapshot,
} from "./exercisePlaybackCoordinator";
export {
  isRhythmPlaybackActive,
  rhythmPlaybackCoordinator,
  type RhythmPlaybackRequest,
  type RhythmPlaybackSnapshot,
} from "./rhythmPlaybackCoordinator";
export {
  ExerciseAuditionController,
  type ExerciseAuditionAudioEngine,
  type ExerciseAuditionNote,
  type ExerciseAuditionRequest,
} from "./exerciseAuditionController";
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
