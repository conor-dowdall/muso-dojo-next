import { clampUnit, normalizePositiveNumber } from "./numeric";
import {
  type HarmonicPartialConfig,
  type HarmonicVoiceConfig,
  type LowPitchAssistConfig,
  type PitchGainConfig,
} from "./types";

export interface ResolvedHarmonicVoiceConfig {
  envelope: HarmonicVoiceConfig["envelope"];
  effects: NonNullable<HarmonicVoiceConfig["effects"]>;
  gain: number;
  partials: readonly HarmonicPartialConfig[];
  unison: HarmonicVoiceConfig["unison"];
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function getLowPitchAssistScale(
  midiNote: number,
  config: LowPitchAssistConfig,
) {
  const fullBelowMidi = Math.min(config.fullBelowMidi, config.fadeOutMidi);
  const fadeOutMidi = Math.max(config.fullBelowMidi, config.fadeOutMidi);

  if (midiNote <= fullBelowMidi) {
    return 1;
  }

  if (midiNote >= fadeOutMidi) {
    return 0;
  }

  return (fadeOutMidi - midiNote) / (fadeOutMidi - fullBelowMidi);
}

function getPitchGain(midiNote: number, config: PitchGainConfig) {
  const referenceMidi = config.referenceMidi;
  const lowMidi = Math.min(config.lowMidi, referenceMidi);
  const highMidi = Math.max(config.highMidi, referenceMidi);

  if (midiNote < referenceMidi && referenceMidi > lowMidi) {
    const progress = clampUnit(
      (referenceMidi - midiNote) / (referenceMidi - lowMidi),
      0,
    );
    return lerp(1, normalizePositiveNumber(config.lowGain, 1), progress);
  }

  if (midiNote > referenceMidi && highMidi > referenceMidi) {
    const progress = clampUnit(
      (midiNote - referenceMidi) / (highMidi - referenceMidi),
      0,
    );
    return lerp(1, normalizePositiveNumber(config.highGain, 1), progress);
  }

  return 1;
}

function mergePartials(
  partials: readonly HarmonicPartialConfig[],
  assist: LowPitchAssistConfig | undefined,
  midiNote: number,
) {
  if (!assist) {
    return partials;
  }

  const assistScale = getLowPitchAssistScale(midiNote, assist);

  if (assistScale <= 0) {
    return partials;
  }

  const gainByMultiple = new Map<number, number>();

  partials.forEach((partial) => {
    gainByMultiple.set(
      partial.multiple,
      (gainByMultiple.get(partial.multiple) ?? 0) + partial.gain,
    );
  });

  assist.partials.forEach((partial) => {
    gainByMultiple.set(
      partial.multiple,
      (gainByMultiple.get(partial.multiple) ?? 0) + partial.gain * assistScale,
    );
  });

  return [...gainByMultiple]
    .sort(([leftMultiple], [rightMultiple]) => leftMultiple - rightMultiple)
    .map(([multiple, gain]) => ({ multiple, gain }));
}

export function resolveHarmonicVoiceConfig(
  voice: HarmonicVoiceConfig,
  midiNote: number,
): ResolvedHarmonicVoiceConfig {
  return {
    envelope: voice.envelope,
    effects: voice.effects ?? [],
    gain:
      voice.gain *
      (voice.pitchGain ? getPitchGain(midiNote, voice.pitchGain) : 1),
    partials: mergePartials(voice.partials, voice.lowPitchAssist, midiNote),
    unison: voice.unison,
  };
}
