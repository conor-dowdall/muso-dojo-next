export type AudioUse = "preview" | "tuning" | "drone" | "exercise";

export type AudioPresetId =
  | "reference-tone"
  | "pluck"
  | "round-pluck"
  | "nylon-ish"
  | "piano"
  | "muted-keys"
  | "tape-keys"
  | "soft-organ"
  | "reed-organ"
  | "soft-pad"
  | "bright-tone"
  | "glass-bell"
  | "hollow-synth"
  | "warm-drive"
  | "fuzz-pluck"
  | "broken-organ"
  | "detuned-stack"
  | "bit-glow"
  | "ghost-harmonics";

export type AudioPresetFamily = "generated" | "sample";
export type AudioPresetCategory = "core" | "instrument" | "character" | "weird";

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

export interface PitchGainConfig {
  highGain: number;
  highMidi: number;
  lowGain: number;
  lowMidi: number;
  referenceMidi: number;
}

export interface LowPitchAssistConfig {
  fadeOutMidi: number;
  fullBelowMidi: number;
  partials: readonly HarmonicPartialConfig[];
}

export interface DistortionConfig {
  amount: number;
  mix?: number;
  oversample?: OverSampleType;
}

export interface UnisonConfig {
  detuneCents: readonly number[];
}

export interface HarmonicVoiceConfig {
  distortion?: DistortionConfig;
  envelope: EnvelopeConfig;
  gain: number;
  lowPitchAssist?: LowPitchAssistConfig;
  partials: readonly HarmonicPartialConfig[];
  pitchGain?: PitchGainConfig;
  unison?: UnisonConfig;
}

export interface AudioPreset {
  category: AudioPresetCategory;
  description?: string;
  family: AudioPresetFamily;
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
