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
  oscillator: OscillatorNode;
  peakGain: number;
  releaseSeconds: number;
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
  const oscillator = context.createOscillator();
  const effectNodes = connectDistortion({
    config: voiceConfig.distortion,
    context,
    destination: envelope,
    source: oscillator,
  });
  let disconnected = false;

  envelope.gain.setValueAtTime(0, startTime);
  oscillator.setPeriodicWave(periodicWave);
  oscillator.frequency.setValueAtTime(frequency, startTime);
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
    oscillator,
    peakGain: voiceGain,
    releaseSeconds: Math.max(0, voiceConfig.envelope.releaseSeconds),
    stopping: false,
    disconnect: () => {
      if (disconnected) {
        return;
      }

      disconnected = true;
      oscillator.disconnect();
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

      try {
        oscillator.stop(releaseEnd);
      } catch {
        // A one-shot voice may already have a stop scheduled.
      }

      onEnded(voice, releaseEnd);
    },
  };

  oscillator.start(startTime);

  return voice;
}
