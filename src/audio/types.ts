export type AudioUse = "preview" | "tuning" | "drone" | "exercise";

export type AudioPresetId =
  | "reference-tone"
  | "piano"
  | "electric-keys"
  | "steel-string"
  | "distortion-guitar"
  | "nylon-string"
  | "picked-bass"
  | "mandolin"
  | "bowed-strings"
  | "bowed-sustain"
  | "soft-organ"
  | "warm-pad"
  | "glass-bell"
  | "hollow-synth"
  | "fuzz-pluck"
  | "bit-glow";

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

export interface DistortionEffectConfig extends DistortionConfig {
  type: "distortion";
}

export interface DelayEffectConfig {
  feedback: number;
  mix: number;
  timeSeconds: number;
  type: "delay";
}

export interface ChorusEffectConfig {
  delaySeconds?: number;
  depthSeconds: number;
  feedback?: number;
  mix: number;
  rateHz: number;
  type: "chorus";
}

export interface ReverbEffectConfig {
  decaySeconds: number;
  mix: number;
  preDelaySeconds?: number;
  toneHz?: number;
  type: "reverb";
}

export type VoiceInsertEffectConfig =
  | ChorusEffectConfig
  | DistortionEffectConfig;

export type MasterAmbienceEffectConfig = DelayEffectConfig | ReverbEffectConfig;

export type AudioEffectConfig =
  | MasterAmbienceEffectConfig
  | VoiceInsertEffectConfig;

export interface UnisonConfig {
  detuneCents: readonly number[];
}

export interface HarmonicVoiceConfig {
  envelope: EnvelopeConfig;
  gain: number;
  insertEffects?: readonly VoiceInsertEffectConfig[];
  lowPitchAssist?: LowPitchAssistConfig;
  partials: readonly HarmonicPartialConfig[];
  pitchGain?: PitchGainConfig;
  unison?: UnisonConfig;
}

export interface AudioPreset {
  category: AudioPresetCategory;
  defaultDurationSeconds: number;
  description?: string;
  family: AudioPresetFamily;
  id: AudioPresetId;
  label: string;
  recommendedUses: readonly AudioUse[];
  voice: HarmonicVoiceConfig;
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
}

export interface DroneNoteRequest {
  id: string;
  midiNote: number;
  velocity?: number;
}

export interface DroneRequest extends Omit<BaseAudioRequest, "velocity"> {
  notes: readonly DroneNoteRequest[];
}

export type MasterAmbiencePresetId = "dry" | "studio-room" | "warm-hall";

export interface MasterAmbiencePreset {
  description?: string;
  effects: readonly MasterAmbienceEffectConfig[];
  id: MasterAmbiencePresetId;
  label: string;
}

export interface AudioEngine {
  getMasterAmbiencePresetId: () => MasterAmbiencePresetId;
  isSupported: () => boolean;
  prime: () => Promise<boolean>;
  playNote: (request: PlayNoteRequest) => Promise<AudioVoiceHandle | undefined>;
  setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => void;
  subscribeToReset: (listener: () => void) => () => void;
  createDrone: (request: DroneRequest) => Promise<DroneHandle | undefined>;
  destroyDrone: (handle: DroneHandle) => void;
  updateDrone: (handle: DroneHandle, request: DroneRequest) => boolean;
  stopAll: () => void;
}
