export type AudioUse = "preview" | "tuning" | "drone" | "exercise";

export type AudioPresetId =
  | "reference-tone"
  | "pluck"
  | "piano"
  | "soft-organ"
  | "bright-tone";

export type AudioVoiceHandle = string & {
  readonly __audioVoiceHandle: unique symbol;
};

export type DroneHandle = string & {
  readonly __droneHandle: unique symbol;
};

export interface EnvelopeConfig {
  attackSeconds: number;
  decaySeconds: number;
  sustainGain: number;
  releaseSeconds: number;
}

export interface HarmonicPartialConfig {
  multiple: number;
  gain: number;
}

export interface HarmonicVoiceConfig {
  envelope: EnvelopeConfig;
  gain: number;
  partials: readonly HarmonicPartialConfig[];
}

export interface AudioPreset {
  id: AudioPresetId;
  label: string;
  supports: readonly AudioUse[];
  voice: HarmonicVoiceConfig;
}

interface BaseAudioRequest {
  concertPitchHz?: number;
  presetId?: AudioPresetId;
  use?: AudioUse;
  velocity?: number;
}

export interface PlayNoteRequest extends BaseAudioRequest {
  durationSeconds: number;
  midiNote: number;
}

export interface DroneRequest extends BaseAudioRequest {
  midiNotes: readonly number[];
}

export interface AudioEngine {
  isSupported: () => boolean;
  prime: () => Promise<boolean>;
  playNote: (request: PlayNoteRequest) => Promise<AudioVoiceHandle | undefined>;
  startDrone: (request: DroneRequest) => Promise<DroneHandle | undefined>;
  stopDrone: (handle: DroneHandle) => void;
  stopAll: () => void;
}
