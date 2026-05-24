import {
  getAttackDecayEnvelopeGainAtTime,
  releaseAudioParam,
} from "./envelope";
import { connectDistortion } from "./distortion";
import {
  type AudioPreset,
  type AudioVoiceHandle,
  type HarmonicPartialConfig,
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
}

export function createHarmonicVoice({
  context,
  destination,
  frequency,
  getPeriodicWave,
  handle,
  midiNote,
  onEnded,
  preset,
  startTime,
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
  midiNote: number;
  onEnded: (voice: ActiveVoice, endTime: number) => void;
  preset: AudioPreset;
  startTime: number;
  velocity: number | undefined;
}) {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return undefined;
  }

  const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);
  const periodicWave = getPeriodicWave(context, voiceConfig.partials);

  if (!periodicWave) {
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

    oscillator.setPeriodicWave(periodicWave);
    oscillator.frequency.setValueAtTime(frequency, startTime);

    if (detuneCents !== 0) {
      oscillator.detune.setValueAtTime(detuneCents, startTime);
    }

    oscillator.connect(sourceMixer);

    return oscillator;
  });
  const effectNodes = connectDistortion({
    config: voiceConfig.distortion,
    context,
    destination: envelope,
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
      effectNodes.forEach((node) => node.disconnect());
      envelope.disconnect();
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
  };

  oscillators.forEach((oscillator) => oscillator.start(startTime));

  return voice;
}
