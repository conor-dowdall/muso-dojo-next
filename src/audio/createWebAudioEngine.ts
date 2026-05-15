import { midiToFrequency, isPlayableMidiNote } from "./pitch";
import { resolveAudioPreset } from "./presets";
import {
  type AudioEngine,
  type AudioPreset,
  type AudioUse,
  type AudioVoiceHandle,
  type DroneHandle,
  type DroneRequest,
  type EnvelopeConfig,
  type HarmonicPartialConfig,
  type PlayNoteRequest,
} from "./types";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const DEFAULT_MASTER_GAIN = 0.72;
const MIN_NOTE_DURATION_SECONDS = 0.02;
const CLEANUP_DELAY_SECONDS = 0.05;
const SILENT_UNLOCK_PULSE_SECONDS = 0.01;

type BrowserAudioContextConstructor = new () => AudioContext;

interface WindowWithWebAudio extends Window {
  AudioContext?: BrowserAudioContextConstructor;
  webkitAudioContext?: BrowserAudioContextConstructor;
}

interface ActiveVoice {
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

interface ActiveDrone {
  handle: DroneHandle;
  voices: ActiveVoice[];
}

function clampUnit(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function normalizePositiveNumber(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const browserWindow = window as WindowWithWebAudio;
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
}

function getValidPartials(preset: AudioPreset) {
  return preset.voice.partials.filter(
    (partial) =>
      Number.isInteger(partial.multiple) &&
      Number.isFinite(partial.multiple) &&
      partial.multiple > 0 &&
      Number.isFinite(partial.gain) &&
      partial.gain > 0,
  );
}

function getPartialsCacheKey(partials: readonly HarmonicPartialConfig[]) {
  return partials
    .map((partial) => `${partial.multiple}:${partial.gain}`)
    .join("|");
}

function getPartialGainScale(partials: readonly HarmonicPartialConfig[]) {
  const totalGain = partials.reduce(
    (total, partial) => total + partial.gain,
    0,
  );
  return totalGain > 0 ? 1 / totalGain : 1;
}

function scheduleAttackDecay(
  param: AudioParam,
  envelope: EnvelopeConfig,
  peakGain: number,
  startTime: number,
) {
  const attackSeconds = Math.max(0, envelope.attackSeconds);
  const decaySeconds = Math.max(0, envelope.decaySeconds);
  const sustainGain = clampUnit(envelope.sustainGain, 1);
  const attackEnd = startTime + attackSeconds;
  const decayEnd = attackEnd + decaySeconds;

  param.cancelScheduledValues(startTime);
  param.setValueAtTime(0, startTime);

  if (attackEnd > startTime) {
    param.linearRampToValueAtTime(peakGain, attackEnd);
  } else {
    param.setValueAtTime(peakGain, startTime);
  }

  if (decayEnd > attackEnd) {
    param.linearRampToValueAtTime(peakGain * sustainGain, decayEnd);
  } else {
    param.setValueAtTime(peakGain * sustainGain, attackEnd);
  }
}

function getAttackDecayGainAtTime(
  envelope: EnvelopeConfig,
  peakGain: number,
  startTime: number,
  sampleTime: number,
) {
  const attackSeconds = Math.max(0, envelope.attackSeconds);
  const decaySeconds = Math.max(0, envelope.decaySeconds);
  const sustainGain = peakGain * clampUnit(envelope.sustainGain, 1);
  const attackEnd = startTime + attackSeconds;
  const decayEnd = attackEnd + decaySeconds;

  if (sampleTime <= startTime) {
    return 0;
  }

  if (attackSeconds > 0 && sampleTime < attackEnd) {
    return peakGain * ((sampleTime - startTime) / attackSeconds);
  }

  if (decaySeconds > 0 && sampleTime < decayEnd) {
    const progress = (sampleTime - attackEnd) / decaySeconds;
    return peakGain + (sustainGain - peakGain) * progress;
  }

  return sustainGain;
}

function scheduleOneShotEnvelope(
  param: AudioParam,
  envelope: EnvelopeConfig,
  peakGain: number,
  startTime: number,
  durationSeconds: number,
) {
  const releaseSeconds = Math.min(
    Math.max(0, envelope.releaseSeconds),
    durationSeconds,
  );
  const attackSeconds = Math.min(
    Math.max(0, envelope.attackSeconds),
    durationSeconds - releaseSeconds,
  );
  const decaySeconds = Math.min(
    Math.max(0, envelope.decaySeconds),
    durationSeconds - releaseSeconds - attackSeconds,
  );
  const sustainGain = clampUnit(envelope.sustainGain, 1);
  const attackEnd = startTime + attackSeconds;
  const decayEnd = attackEnd + decaySeconds;
  const releaseStart = startTime + durationSeconds - releaseSeconds;

  param.cancelScheduledValues(startTime);
  param.setValueAtTime(0, startTime);

  if (attackEnd > startTime) {
    param.linearRampToValueAtTime(peakGain, attackEnd);
  } else {
    param.setValueAtTime(peakGain, startTime);
  }

  const releaseGain = decayEnd > attackEnd ? peakGain * sustainGain : peakGain;

  if (decayEnd > attackEnd) {
    param.linearRampToValueAtTime(releaseGain, decayEnd);
  }

  param.setValueAtTime(releaseGain, releaseStart);
  param.linearRampToValueAtTime(0, startTime + durationSeconds);
}

function getOneShotGainAtTime(
  envelope: EnvelopeConfig,
  peakGain: number,
  startTime: number,
  durationSeconds: number,
  sampleTime: number,
) {
  const releaseSeconds = Math.min(
    Math.max(0, envelope.releaseSeconds),
    durationSeconds,
  );
  const attackSeconds = Math.min(
    Math.max(0, envelope.attackSeconds),
    durationSeconds - releaseSeconds,
  );
  const decaySeconds = Math.min(
    Math.max(0, envelope.decaySeconds),
    durationSeconds - releaseSeconds - attackSeconds,
  );
  const sustainGain = peakGain * clampUnit(envelope.sustainGain, 1);
  const attackEnd = startTime + attackSeconds;
  const decayEnd = attackEnd + decaySeconds;
  const releaseStart = startTime + durationSeconds - releaseSeconds;
  const endTime = startTime + durationSeconds;
  const releaseGain = decayEnd > attackEnd ? sustainGain : peakGain;

  if (sampleTime <= startTime) {
    return 0;
  }

  if (sampleTime >= endTime) {
    return 0;
  }

  if (attackSeconds > 0 && sampleTime < attackEnd) {
    return peakGain * ((sampleTime - startTime) / attackSeconds);
  }

  if (decaySeconds > 0 && sampleTime < decayEnd) {
    const progress = (sampleTime - attackEnd) / decaySeconds;
    return peakGain + (releaseGain - peakGain) * progress;
  }

  if (releaseSeconds > 0 && sampleTime >= releaseStart) {
    const progress = (sampleTime - releaseStart) / releaseSeconds;
    return releaseGain * (1 - progress);
  }

  return releaseGain;
}

function releaseAudioParam(
  param: AudioParam,
  stopTime: number,
  fallbackGain: number,
) {
  const holdableParam = param as AudioParam & {
    cancelAndHoldAtTime?: (cancelTime: number) => AudioParam;
  };

  if (holdableParam.cancelAndHoldAtTime) {
    holdableParam.cancelAndHoldAtTime(stopTime);
    return;
  }

  param.cancelScheduledValues(stopTime);
  param.setValueAtTime(fallbackGain, stopTime);
}

export function createWebAudioEngine(): AudioEngine {
  let audioContext: AudioContext | undefined;
  let masterGain: GainNode | undefined;
  let primedContext: AudioContext | undefined;
  let nextVoiceId = 0;
  let nextDroneId = 0;
  const activeVoices = new Map<AudioVoiceHandle, ActiveVoice>();
  const activeDrones = new Map<DroneHandle, ActiveDrone>();
  const periodicWaveCache = new WeakMap<
    AudioContext,
    Map<string, PeriodicWave>
  >();

  function getAudioContext() {
    if (audioContext?.state === "closed") {
      audioContext = undefined;
      masterGain = undefined;
    }

    if (!audioContext) {
      const AudioContextConstructor = getAudioContextConstructor();

      if (!AudioContextConstructor) {
        return undefined;
      }

      audioContext = new AudioContextConstructor();
    }

    return audioContext;
  }

  function getRunningAudioContext() {
    const context = getAudioContext();

    return context?.state === "running" ? context : undefined;
  }

  async function getReadyAudioContext() {
    const context = getAudioContext();

    if (!context) {
      return undefined;
    }

    if (context.state !== "running") {
      try {
        await context.resume();
      } catch {
        return undefined;
      }
    }

    return context.state === "running" ? context : undefined;
  }

  function getMasterGain(context: AudioContext) {
    if (!masterGain || masterGain.context !== context) {
      masterGain = context.createGain();
      masterGain.gain.setValueAtTime(DEFAULT_MASTER_GAIN, context.currentTime);
      masterGain.connect(context.destination);
    }

    return masterGain;
  }

  function getPeriodicWave(
    context: AudioContext,
    partials: readonly HarmonicPartialConfig[],
  ) {
    const cacheKey = getPartialsCacheKey(partials);
    const contextCache = periodicWaveCache.get(context) ?? new Map();
    const cachedWave = contextCache.get(cacheKey);

    if (cachedWave) {
      return cachedWave;
    }

    const highestPartial = Math.max(
      ...partials.map((partial) => partial.multiple),
    );
    const real = new Float32Array(highestPartial + 1);
    const imag = new Float32Array(highestPartial + 1);
    const partialGainScale = getPartialGainScale(partials);

    partials.forEach((partial) => {
      imag[partial.multiple] = partial.gain * partialGainScale;
    });

    const wave = context.createPeriodicWave(real, imag, {
      disableNormalization: true,
    });
    contextCache.set(cacheKey, wave);
    periodicWaveCache.set(context, contextCache);

    return wave;
  }

  function primeContext(context: AudioContext) {
    getMasterGain(context);

    if (primedContext === context) {
      return;
    }

    primedContext = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const stopTime = startTime + SILENT_UNLOCK_PULSE_SECONDS;

    gain.gain.setValueAtTime(0, startTime);
    oscillator.connect(gain);
    gain.connect(getMasterGain(context));
    oscillator.start(startTime);
    oscillator.stop(stopTime);

    window.setTimeout(
      () => {
        oscillator.disconnect();
        gain.disconnect();
      },
      (SILENT_UNLOCK_PULSE_SECONDS + CLEANUP_DELAY_SECONDS) * 1000,
    );
  }

  function scheduleVoiceCleanup(voice: ActiveVoice, cleanupTime: number) {
    const context = voice.envelope.context;
    const delaySeconds =
      Math.max(0, cleanupTime - context.currentTime) + CLEANUP_DELAY_SECONDS;

    window.setTimeout(() => {
      voice.disconnect();
      activeVoices.delete(voice.handle);
    }, delaySeconds * 1000);
  }

  function createVoice({
    context,
    frequency,
    preset,
    startTime,
    velocity,
  }: {
    context: AudioContext;
    frequency: number;
    preset: AudioPreset;
    startTime: number;
    velocity: number | undefined;
  }) {
    const partials = getValidPartials(preset);

    if (partials.length === 0) {
      return undefined;
    }

    const handle = `voice-${nextVoiceId++}` as AudioVoiceHandle;
    const voiceGain = preset.voice.gain * clampUnit(velocity, 1);
    const envelope = context.createGain();
    const oscillator = context.createOscillator();

    oscillator.setPeriodicWave(getPeriodicWave(context, partials));
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.connect(envelope);

    envelope.connect(getMasterGain(context));

    const voice: ActiveVoice = {
      handle,
      envelope,
      getGainAtTime: (sampleTime) =>
        getAttackDecayGainAtTime(
          preset.voice.envelope,
          voiceGain,
          startTime,
          sampleTime,
        ),
      oscillator,
      peakGain: voiceGain,
      releaseSeconds: Math.max(0, preset.voice.envelope.releaseSeconds),
      stopping: false,
      disconnect: () => {
        oscillator.disconnect();
        envelope.disconnect();
      },
      stop: (stopTime = context.currentTime) => {
        if (voice.stopping) {
          return;
        }

        voice.stopping = true;
        const releaseStart = Math.max(context.currentTime, stopTime);
        const releaseEnd = releaseStart + voice.releaseSeconds;

        releaseAudioParam(
          envelope.gain,
          releaseStart,
          voice.getGainAtTime(releaseStart),
        );
        envelope.gain.linearRampToValueAtTime(0, releaseEnd);
        try {
          oscillator.stop(releaseEnd);
        } catch {
          // The oscillator may already have a stop scheduled by a one-shot note.
        }
        scheduleVoiceCleanup(voice, releaseEnd);
      },
    };

    activeVoices.set(handle, voice);
    oscillator.start(startTime);

    return voice;
  }

  function playNoteWithContext(
    context: AudioContext,
    request: PlayNoteRequest,
  ) {
    const use = request.use ?? DEFAULT_AUDIO_USE;
    const preset = resolveAudioPreset(use, request.presetId);
    const durationSeconds = Math.max(
      MIN_NOTE_DURATION_SECONDS,
      normalizePositiveNumber(
        request.durationSeconds,
        MIN_NOTE_DURATION_SECONDS,
      ),
    );
    const startTime = context.currentTime;
    const voice = createVoice({
      context,
      frequency: midiToFrequency(request.midiNote, request.concertPitchHz),
      preset,
      startTime,
      velocity: request.velocity,
    });

    if (!voice) {
      return undefined;
    }

    scheduleOneShotEnvelope(
      voice.envelope.gain,
      preset.voice.envelope,
      voice.peakGain,
      startTime,
      durationSeconds,
    );
    voice.getGainAtTime = (sampleTime) =>
      getOneShotGainAtTime(
        preset.voice.envelope,
        voice.peakGain,
        startTime,
        durationSeconds,
        sampleTime,
      );

    const stopTime = startTime + durationSeconds;
    voice.oscillator.stop(stopTime);
    scheduleVoiceCleanup(voice, stopTime);

    return voice.handle;
  }

  function startDroneWithContext(context: AudioContext, request: DroneRequest) {
    const midiNotes = request.midiNotes.filter(isPlayableMidiNote);

    if (midiNotes.length === 0) {
      return undefined;
    }

    const use = request.use ?? "drone";
    const preset = resolveAudioPreset(use, request.presetId);
    const startTime = context.currentTime;
    const voices = midiNotes
      .map((midiNote) =>
        createVoice({
          context,
          frequency: midiToFrequency(midiNote, request.concertPitchHz),
          preset,
          startTime,
          velocity: request.velocity,
        }),
      )
      .filter((voice): voice is ActiveVoice => voice !== undefined);

    if (voices.length === 0) {
      return undefined;
    }

    const handle = `drone-${nextDroneId++}` as DroneHandle;
    activeDrones.set(handle, { handle, voices });
    voices.forEach((voice) =>
      scheduleAttackDecay(
        voice.envelope.gain,
        preset.voice.envelope,
        voice.peakGain,
        startTime,
      ),
    );

    return handle;
  }

  return {
    isSupported: () => getAudioContextConstructor() !== undefined,
    prime: async () => {
      const context = await getReadyAudioContext();

      if (!context) {
        return false;
      }

      primeContext(context);
      return true;
    },
    playNote: (request: PlayNoteRequest) => {
      if (!isPlayableMidiNote(request.midiNote)) {
        return Promise.resolve(undefined);
      }

      const runningContext = getRunningAudioContext();

      if (runningContext) {
        return Promise.resolve(playNoteWithContext(runningContext, request));
      }

      return getReadyAudioContext().then((context) => {
        if (!context) {
          return undefined;
        }

        primeContext(context);
        return playNoteWithContext(context, request);
      });
    },
    startDrone: (request: DroneRequest) => {
      if (!request.midiNotes.some(isPlayableMidiNote)) {
        return Promise.resolve(undefined);
      }

      const runningContext = getRunningAudioContext();

      if (runningContext) {
        return Promise.resolve(startDroneWithContext(runningContext, request));
      }

      return getReadyAudioContext().then((context) => {
        if (!context) {
          return undefined;
        }

        primeContext(context);
        return startDroneWithContext(context, request);
      });
    },
    stopDrone: (handle: DroneHandle) => {
      const drone = activeDrones.get(handle);

      if (!drone) {
        return;
      }

      drone.voices.forEach((voice) => voice.stop());
      activeDrones.delete(handle);
    },
    stopAll: () => {
      activeDrones.clear();
      activeVoices.forEach((voice) => voice.stop());
    },
  };
}

export const musoAudioEngine = createWebAudioEngine();
