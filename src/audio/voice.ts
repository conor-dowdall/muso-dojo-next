import { getAttackDecayEnvelopeGainAtTime } from "./envelope";
import { createAudioParamAutomation } from "./audioParamAutomation";
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

const AUDIO_RENDER_QUANTUM_FRAMES = 128;
const VOICE_STOP_SILENCE_RENDER_QUANTA = 3;

export function getVoiceStopSilenceSeconds(context: AudioContext) {
  return (
    (AUDIO_RENDER_QUANTUM_FRAMES * VOICE_STOP_SILENCE_RENDER_QUANTA) /
    context.sampleRate
  );
}

export interface ActiveVoice {
  disconnect: () => void;
  envelope: GainNode;
  getGainAtTime: (sampleTime: number) => number;
  handle: AudioVoiceHandle;
  peakGain: number;
  releaseSeconds: number;
  scheduleStop: (stopTime: number) => void;
  setFrequency: (
    frequency: number,
    startTime?: number,
    rampSeconds?: number,
  ) => void;
  setLevelGain: (
    levelGain: number,
    startTime?: number,
    rampSeconds?: number,
  ) => void;
  stop: (options?: { releaseSeconds?: number; stopTime?: number }) => void;
  stopping: boolean;
  tailSeconds: number;
}

export function getHarmonicVoiceLevelGain({
  midiNote,
  preset,
  velocity,
}: {
  midiNote: number;
  preset: AudioPreset;
  velocity: number | undefined;
}) {
  const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);

  return (
    normalizeNonNegativeNumber(voiceConfig.gain, 0) * clampUnit(velocity, 1)
  );
}

export function createHarmonicVoice({
  context,
  destination,
  frequency,
  getPeriodicWave,
  handle,
  insertEffects,
  midiNote,
  minimumAttackSeconds = 0,
  minimumReleaseSeconds = 0,
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
  minimumAttackSeconds?: number;
  minimumReleaseSeconds?: number;
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

  const voiceGain = getHarmonicVoiceLevelGain({
    midiNote,
    preset,
    velocity,
  });

  if (voiceGain <= 0) {
    return undefined;
  }

  const envelope = context.createGain();
  const level = context.createGain();
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
  const frequencyAutomation = createAudioParamAutomation({
    initialValue: frequency,
    params: oscillators.map((oscillator) => oscillator.frequency),
    startTime,
  });
  const levelAutomation = createAudioParamAutomation({
    initialValue: voiceGain,
    params: [level.gain],
    startTime,
  });
  let disconnected = false;
  let endedOscillatorCount = 0;

  envelope.gain.setValueAtTime(0, startTime);
  sourceMixer.gain.setValueAtTime(
    1 / Math.sqrt(Math.max(1, oscillators.length)),
    startTime,
  );
  envelope.connect(level);
  level.connect(destination);

  const voice: ActiveVoice = {
    handle,
    envelope,
    getGainAtTime: (sampleTime) =>
      getAttackDecayEnvelopeGainAtTime({
        envelope: voiceConfig.envelope,
        minimumAttackSeconds,
        peakGain: 1,
        sampleTime,
        startTime,
      }),
    peakGain: 1,
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
    setFrequency: (
      nextFrequency,
      frequencyStartTime = context.currentTime,
      rampSeconds = 0,
    ) => {
      if (!Number.isFinite(nextFrequency) || nextFrequency <= 0) {
        return;
      }

      frequencyAutomation.exponentialRampToValueAtTime(
        nextFrequency,
        frequencyStartTime,
        rampSeconds,
      );
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
      level.disconnect();
      onDisconnect?.();
    },
    setLevelGain: (
      nextLevelGain,
      startTime = context.currentTime,
      rampSeconds = 0,
    ) => {
      const normalizedLevelGain = normalizeNonNegativeNumber(nextLevelGain, 0);

      levelAutomation.linearRampToValueAtTime(
        normalizedLevelGain,
        startTime,
        rampSeconds,
      );
    },
    stop: ({
      releaseSeconds = Math.max(voice.releaseSeconds, minimumReleaseSeconds),
      stopTime = context.currentTime,
    } = {}) => {
      if (voice.stopping) {
        return;
      }

      voice.stopping = true;
      const automationStart = context.currentTime;
      const releaseStart = Math.max(context.currentTime, stopTime);
      const releaseEnd = releaseStart + Math.max(0, releaseSeconds);
      const oscillatorStopTime =
        releaseEnd + getVoiceStopSilenceSeconds(context);
      const automationStartGain = voice.getGainAtTime(automationStart);
      const releaseStartGain = voice.getGainAtTime(releaseStart);

      envelope.gain.cancelScheduledValues(automationStart);
      envelope.gain.setValueAtTime(automationStartGain, automationStart);

      if (releaseStart > automationStart) {
        envelope.gain.linearRampToValueAtTime(releaseStartGain, releaseStart);
      } else {
        envelope.gain.setValueAtTime(releaseStartGain, releaseStart);
      }

      if (releaseEnd > releaseStart) {
        envelope.gain.linearRampToValueAtTime(0, releaseEnd);
      } else {
        envelope.gain.setValueAtTime(0, releaseEnd);
      }

      envelope.gain.setValueAtTime(0, oscillatorStopTime);
      voice.scheduleStop(oscillatorStopTime);
    },
    tailSeconds: normalizeNonNegativeNumber(tailSeconds, 0),
  };

  oscillators.forEach((oscillator) => {
    oscillator.addEventListener(
      "ended",
      () => {
        endedOscillatorCount += 1;

        if (endedOscillatorCount === oscillators.length) {
          onEnded(voice, context.currentTime);
        }
      },
      { once: true },
    );
  });
  oscillators.forEach((oscillator) => oscillator.start(startTime));

  return voice;
}
