export type AudioUse = "preview" | "tuning" | "drone" | "exercise";

export type AudioPresetId = "piano" | "plucked-string" | "bowed-strings";
export type SamplePackId = AudioPresetId | "metronome";
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
  availableOn: readonly AudioPresetSurface[];
  defaultDurationSeconds: number;
  description?: string;
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
    options?: { releaseSeconds?: number },
  ) => void;
  createPlaybackGroup: () => PlaybackGroupHandle;
  getCurrentTime: () => number | undefined;
  getOutputClock: () => AudioClockSnapshot | undefined;
  isSupported: () => boolean;
  prime: () => Promise<boolean>;
  playNote: (request: PlayNoteRequest) => Promise<AudioVoiceHandle | undefined>;
  scheduleMetronomeClick: (request: ScheduleMetronomeClickRequest) => boolean;
  scheduleNote: (request: ScheduleNoteRequest) => AudioVoiceHandle | undefined;
  subscribeToStopAll: (listener: () => void) => () => void;
  subscribeToVoiceEnd: (
    handle: AudioVoiceHandle,
    listener: () => void,
  ) => () => void;
  createDrone: (request: DroneRequest) => Promise<DroneHandle | undefined>;
  destroyDrone: (handle: DroneHandle) => void;
  updateDrone: (handle: DroneHandle, request: DroneRequest) => boolean;
  stopAll: () => void;
}
