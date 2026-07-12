import { type PercussionSampleId } from "@/data/rhythmPresets";

export type AudioUse = "preview" | "tuning" | "drone" | "exercise";

export type AudioPresetId =
  "piano" | "plucked-string" | "acoustic-bass" | "bowed-strings";
export type SamplePackId = AudioPresetId | "acoustic-bass" | "percussion";
export type AudioPresetSurface = "instrument" | "drone" | "exercise";

export type AudioVoiceHandle = string & {
  readonly __audioVoiceHandle: unique symbol;
};

export type DroneHandle = string & {
  readonly __droneHandle: unique symbol;
};

export type PlaybackGroupHandle = string & {
  readonly __playbackGroupHandle: unique symbol;
};

export interface AudioClockSnapshot {
  contextTime: number;
  performanceTime: number;
}

export interface SampleEnvelopeConfig {
  attackSeconds: number;
  decaySeconds: number;
  sustainGain: number;
  releaseSeconds: number;
}

export interface AudioPreset {
  attackSecondsByUse?: Partial<Record<AudioUse, number>>;
  availableOn: readonly AudioPresetSurface[];
  defaultDurationSeconds: number;
  envelope: SampleEnvelopeConfig;
  gain: number;
  id: AudioPresetId;
  label: string;
  samplePackId: SamplePackId;
}

interface BaseAudioRequest {
  concertPitchHz?: number;
  presetId?: AudioPresetId;
  use?: AudioUse;
  velocity?: number;
}

export interface PlayNoteRequest extends BaseAudioRequest {
  durationSeconds?: number;
  midiNote: number;
  signal?: AbortSignal;
}

export interface ScheduleNoteRequest extends PlayNoteRequest {
  group: PlaybackGroupHandle;
  startTime: number;
}

export interface ScheduleMetronomeClickRequest {
  accent?: boolean;
  group: PlaybackGroupHandle;
  startTime: number;
}

export interface SchedulePercussionHitRequest {
  group: PlaybackGroupHandle;
  sampleId: PercussionSampleId;
  startTime: number;
  velocity?: number;
}

export interface DroneNoteRequest {
  id: string;
  midiNote: number;
  velocity?: number;
}

export interface DroneRequest extends Omit<BaseAudioRequest, "velocity"> {
  notes: readonly DroneNoteRequest[];
}

export interface AudioEngine {
  cancelPlaybackGroup: (
    handle: PlaybackGroupHandle,
    options?: { atTime?: number; releaseSeconds?: number },
  ) => void;
  clearPlaybackGroupCancellation: (handle: PlaybackGroupHandle) => boolean;
  createPlaybackGroup: () => PlaybackGroupHandle;
  getCurrentTime: () => number | undefined;
  getOutputClock: () => AudioClockSnapshot | undefined;
  hasActivePlayback: () => boolean;
  isSupported: () => boolean;
  prime: () => Promise<boolean>;
  warm: () => Promise<boolean>;
  playNote: (request: PlayNoteRequest) => Promise<AudioVoiceHandle | undefined>;
  scheduleMetronomeClick: (request: ScheduleMetronomeClickRequest) => boolean;
  scheduleNote: (request: ScheduleNoteRequest) => AudioVoiceHandle | undefined;
  schedulePercussionHit: (request: SchedulePercussionHitRequest) => boolean;
  subscribeToStopAll: (listener: () => void) => () => void;
  subscribeToPlaybackActivity: (listener: () => void) => () => void;
  subscribeToVoiceEnd: (
    handle: AudioVoiceHandle,
    listener: () => void,
  ) => () => void;
  createDrone: (request: DroneRequest) => Promise<DroneHandle | undefined>;
  destroyDrone: (handle: DroneHandle) => void;
  updateDrone: (handle: DroneHandle, request: DroneRequest) => boolean;
  stopAll: () => void;
}
