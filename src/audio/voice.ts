import {
  getAttackDecayEnvelopeGainAtTime,
  releaseAudioParam,
} from "./envelope";
import { connectAudioEffectChain } from "./effects";
import { canUseNativeSineOscillator } from "./harmonicWave";
import {
  type AudioPreset,
  type AudioVoiceHandle,
  type HarmonicPartialConfig,
  type VoiceInsertEffectConfig,
} from "./types";
import { clampUnit, normalizeNonNegativeNumber } from "./numeric";
import { resolveHarmonicVoiceConfig } from "./voiceConfig";

export interface ActiveVoice {
  disconnect: () => void;
  envelope: GainNode;
  getGainAtTime: (sampleTime: number) => number;
  handle: AudioVoiceHandle;
  peakGain: number;
  releaseSeconds: number;
  scheduleStop: (stopTime: number) => void;
  stop: (stopTime?: number) => void;
  stopping: boolean;
  tailSeconds: number;
}

export function createHarmonicVoice({
  context,
  destination,
  frequency,
  getPeriodicWave,
  handle,
  insertEffects,
  midiNote,
  onDisconnect,
  onEnded,
  preset,
  startTime,
  tailSeconds,
  velocity,
}: {
  context: AudioContext;
  destination: AudioNode;
  frequency: number;
  getPeriodicWave: (
    context: AudioContext,
    partials: readonly HarmonicPartialConfig[],
  ) => PeriodicWave | undefined;
  handle: AudioVoiceHandle;
  insertEffects?: readonly VoiceInsertEffectConfig[];
  midiNote: number;
  onDisconnect?: () => void;
  onEnded: (voice: ActiveVoice, endTime: number) => void;
  preset: AudioPreset;
  startTime: number;
  tailSeconds?: number;
  velocity: number | undefined;
}) {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return undefined;
  }

  const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);
  const useNativeSineOscillator = canUseNativeSineOscillator(
    voiceConfig.partials,
  );
  const periodicWave = useNativeSineOscillator
    ? undefined
    : getPeriodicWave(context, voiceConfig.partials);

  if (!useNativeSineOscillator && !periodicWave) {
    return undefined;
  }

  const voiceGain =
    normalizeNonNegativeNumber(voiceConfig.gain, 0) * clampUnit(velocity, 1);

  if (voiceGain <= 0) {
    return undefined;
  }

  const envelope = context.createGain();
  const sourceMixer = context.createGain();
  const requestedDetuneCents =
    voiceConfig.unison?.detuneCents.filter(Number.isFinite) ?? [];
  const oscillatorDetuneCents =
    requestedDetuneCents.length > 0 ? requestedDetuneCents : [0];
  const oscillators = oscillatorDetuneCents.map((detuneCents) => {
    const oscillator = context.createOscillator();

    if (periodicWave) {
      oscillator.setPeriodicWave(periodicWave);
    }

    oscillator.frequency.setValueAtTime(frequency, startTime);

    if (detuneCents !== 0) {
      oscillator.detune.setValueAtTime(detuneCents, startTime);
    }

    oscillator.connect(sourceMixer);

    return oscillator;
  });
  const insertEffectChain = connectAudioEffectChain({
    context,
    destination: envelope,
    effects: insertEffects ?? voiceConfig.insertEffects,
    source: sourceMixer,
  });
  let disconnected = false;

  envelope.gain.setValueAtTime(0, startTime);
  sourceMixer.gain.setValueAtTime(
    1 / Math.sqrt(Math.max(1, oscillators.length)),
    startTime,
  );
  envelope.connect(destination);

  const voice: ActiveVoice = {
    handle,
    envelope,
    getGainAtTime: (sampleTime) =>
      getAttackDecayEnvelopeGainAtTime({
        envelope: voiceConfig.envelope,
        peakGain: voiceGain,
        sampleTime,
        startTime,
      }),
    peakGain: voiceGain,
    releaseSeconds: Math.max(0, voiceConfig.envelope.releaseSeconds),
    scheduleStop: (stopTime: number) => {
      oscillators.forEach((oscillator) => {
        try {
          oscillator.stop(stopTime);
        } catch {
          // The voice may already have a stop scheduled.
        }
      });
    },
    stopping: false,
    disconnect: () => {
      if (disconnected) {
        return;
      }

      disconnected = true;
      oscillators.forEach((oscillator) => oscillator.disconnect());
      sourceMixer.disconnect();
      insertEffectChain.dispose();
      envelope.disconnect();
      onDisconnect?.();
    },
    stop: (stopTime = context.currentTime) => {
      if (voice.stopping) {
        return;
      }

      voice.stopping = true;
      const releaseStart = Math.max(context.currentTime, stopTime);
      const releaseEnd = releaseStart + voice.releaseSeconds;

      releaseAudioParam({
        fallbackGain: voice.getGainAtTime(releaseStart),
        param: envelope.gain,
        stopTime: releaseStart,
      });

      if (releaseEnd > releaseStart) {
        envelope.gain.linearRampToValueAtTime(0, releaseEnd);
      } else {
        envelope.gain.setValueAtTime(0, releaseEnd);
      }

      voice.scheduleStop(releaseEnd);
      onEnded(voice, releaseEnd);
    },
    tailSeconds: normalizeNonNegativeNumber(tailSeconds, 0),
  };

  oscillators.forEach((oscillator) => oscillator.start(startTime));

  return voice;
}
