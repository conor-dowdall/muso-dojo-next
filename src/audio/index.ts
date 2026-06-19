export { createWebAudioEngine, musoAudioEngine } from "./createWebAudioEngine";
export {
  audioReadiness,
  createAudioReadinessController,
  ensureAudioReady,
  type AudioReadinessSnapshot,
  type AudioReadinessStatus,
} from "./audioReadiness";
export {
  createLookaheadScheduler,
  type LookaheadScheduler,
  type LookaheadSchedulerEvent,
  type LookaheadSchedulerOptions,
} from "./lookaheadScheduler";
export {
  exercisePlaybackRequestsAreEqual,
  exercisePlaybackCoordinator,
  isExercisePlaybackActive,
  type ExercisePlaybackEvent,
  type ExercisePlaybackRequest,
  type ExercisePlaybackSnapshot,
} from "./exercisePlaybackCoordinator";
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
export { preloadSamplePackAssets } from "./samplePackLibrary";
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
} from "./types";
