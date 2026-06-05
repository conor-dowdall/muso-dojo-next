import { getAudioContextConstructor } from "./audioContext";
import {
  getOneShotEnvelopeGainAtTime,
  scheduleAttackDecayEnvelope,
  scheduleOneShotEnvelope,
} from "./envelope";
import {
  connectAudioEffectChain,
  type ConnectedAudioEffectChain,
} from "./effects";
import {
  canUseNativeSineOscillator,
  createHarmonicWaveCache,
} from "./harmonicWave";
import { DEFAULT_MASTER_AMBIENCE_PRESET_ID } from "./masterAmbience";
import { createAudioMixer, type AudioMixer } from "./mixer";
import { normalizePositiveNumber } from "./numeric";
import { midiToFrequency, isPlayableMidiNote } from "./pitch";
import {
  audioPresets,
  getDefaultAudioPresetId,
  resolveAudioPreset,
} from "./presets";
import { createHarmonicVoice, type ActiveVoice } from "./voice";
import { resolveHarmonicVoiceConfig } from "./voiceConfig";
import {
  type AudioEngine,
  type AudioPreset,
  type AudioUse,
  type AudioVoiceHandle,
  type DroneHandle,
  type DroneRequest,
  type MasterAmbiencePresetId,
  type PlayNoteRequest,
  type VoiceInsertEffectConfig,
} from "./types";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const DEFAULT_DRONE_USE = "drone" satisfies AudioUse;
const MIN_NOTE_DURATION_SECONDS = 0.02;
const CLEANUP_DELAY_SECONDS = 0.05;
const SILENT_UNLOCK_PULSE_SECONDS = 0.01;
const WARMUP_MIDI_NOTES = [36, 48, 60, 72] as const;

interface ActiveDrone {
  handle: DroneHandle;
  voices: ActiveVoice[];
}

interface SharedDroneEffectBus {
  cleanupTimer: number | undefined;
  disposed: boolean;
  effectChain: ConnectedAudioEffectChain;
  input: GainNode;
  key: string;
  refCount: number;
}

function isSharedDroneEffect(effect: VoiceInsertEffectConfig) {
  return effect.type === "chorus";
}

function getSharedDroneInsertEffects(
  effects: readonly VoiceInsertEffectConfig[],
) {
  return effects.length > 0 && effects.every(isSharedDroneEffect)
    ? effects
    : [];
}

function getPerVoiceDroneInsertEffects(
  effects: readonly VoiceInsertEffectConfig[],
) {
  return getSharedDroneInsertEffects(effects).length > 0 ? [] : effects;
}

function getDroneEffectKeyPart(effect: VoiceInsertEffectConfig) {
  switch (effect.type) {
    case "chorus":
      return [
        effect.type,
        effect.delaySeconds ?? "",
        effect.depthSeconds,
        effect.feedback ?? "",
        effect.mix,
        effect.rateHz,
      ].join(":");
    case "distortion":
      return [
        effect.type,
        effect.amount,
        effect.mix ?? "",
        effect.oversample ?? "",
      ].join(":");
  }
}

function getSharedDroneEffectBusKey({
  effects,
  use,
}: {
  effects: readonly VoiceInsertEffectConfig[];
  use: AudioUse;
}) {
  return `${use}:${effects.map(getDroneEffectKeyPart).join("|")}`;
}

export function createWebAudioEngine(): AudioEngine {
  let audioContext: AudioContext | undefined;
  let masterAmbiencePresetId: MasterAmbiencePresetId =
    DEFAULT_MASTER_AMBIENCE_PRESET_ID;
  let audioMixer: AudioMixer | undefined;
  let primedContext: AudioContext | undefined;
  let readyContextPromise: Promise<AudioContext | undefined> | undefined;
  let nextVoiceId = 0;
  let nextDroneId = 0;
  const activeVoices = new Map<AudioVoiceHandle, ActiveVoice>();
  const activeDrones = new Map<DroneHandle, ActiveDrone>();
  const sharedDroneEffectBuses = new Map<string, SharedDroneEffectBus>();
  const harmonicWaveCache = createHarmonicWaveCache();

  function disposeSharedDroneEffectBus(bus: SharedDroneEffectBus) {
    if (bus.disposed) {
      if (sharedDroneEffectBuses.get(bus.key) === bus) {
        sharedDroneEffectBuses.delete(bus.key);
      }
      return;
    }

    bus.disposed = true;

    if (bus.cleanupTimer !== undefined) {
      window.clearTimeout(bus.cleanupTimer);
      bus.cleanupTimer = undefined;
    }

    bus.input.disconnect();
    bus.effectChain.dispose();

    if (sharedDroneEffectBuses.get(bus.key) === bus) {
      sharedDroneEffectBuses.delete(bus.key);
    }
  }

  function clearSharedDroneEffectBuses() {
    Array.from(sharedDroneEffectBuses.values()).forEach((bus) => {
      try {
        disposeSharedDroneEffectBus(bus);
      } catch {
        // The browser may already have torn down the underlying audio graph.
      }
    });
    sharedDroneEffectBuses.clear();
  }

  function clearContextReferences() {
    try {
      clearSharedDroneEffectBuses();
      audioMixer?.dispose();
    } catch {
      // The browser may already have torn down the underlying audio graph.
    }

    audioContext = undefined;
    audioMixer = undefined;
    primedContext = undefined;
    readyContextPromise = undefined;
  }

  function getAudioContext() {
    if (audioContext?.state === "closed") {
      clearContextReferences();
    }

    if (audioContext) {
      return audioContext;
    }

    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return undefined;
    }

    try {
      audioContext = new AudioContextConstructor({
        latencyHint: "interactive",
      });
    } catch {
      return undefined;
    }

    return audioContext;
  }

  function getRunningAudioContext() {
    const context = getAudioContext();

    return context?.state === "running" ? context : undefined;
  }

  async function getReadyAudioContext() {
    const runningContext = getRunningAudioContext();

    if (runningContext) {
      return runningContext;
    }

    if (readyContextPromise) {
      return readyContextPromise;
    }

    const context = getAudioContext();

    if (!context) {
      return undefined;
    }

    readyContextPromise = (async () => {
      try {
        if (context.state !== "running") {
          await context.resume();
        }
      } catch {
        return undefined;
      }

      return context.state === "running" ? context : undefined;
    })().finally(() => {
      readyContextPromise = undefined;
    });

    return readyContextPromise;
  }

  function getAudioMixer(context: AudioContext) {
    if (!audioMixer) {
      audioMixer = createAudioMixer({
        context,
        masterAmbiencePresetId,
      });
    }

    return audioMixer;
  }

  function getSharedDroneEffectBus({
    context,
    effects,
    use,
  }: {
    context: AudioContext;
    effects: readonly VoiceInsertEffectConfig[];
    use: AudioUse;
  }) {
    const key = getSharedDroneEffectBusKey({ effects, use });
    const existingBus = sharedDroneEffectBuses.get(key);

    if (existingBus) {
      if (existingBus.cleanupTimer !== undefined) {
        window.clearTimeout(existingBus.cleanupTimer);
        existingBus.cleanupTimer = undefined;
      }

      return existingBus;
    }

    const input = context.createGain();
    const effectChain = connectAudioEffectChain({
      context,
      destination: getAudioMixer(context).getInput(use),
      effects,
      source: input,
    });
    const bus: SharedDroneEffectBus = {
      cleanupTimer: undefined,
      disposed: false,
      effectChain,
      input,
      key,
      refCount: 0,
    };

    sharedDroneEffectBuses.set(key, bus);
    return bus;
  }

  function retainSharedDroneEffectBus(bus: SharedDroneEffectBus) {
    if (bus.disposed) {
      return;
    }

    if (bus.cleanupTimer !== undefined) {
      window.clearTimeout(bus.cleanupTimer);
      bus.cleanupTimer = undefined;
    }

    bus.refCount += 1;
  }

  function releaseSharedDroneEffectBus(bus: SharedDroneEffectBus) {
    if (bus.disposed) {
      return;
    }

    bus.refCount = Math.max(0, bus.refCount - 1);

    if (bus.refCount > 0 || bus.cleanupTimer !== undefined) {
      return;
    }

    bus.cleanupTimer = window.setTimeout(
      () => {
        if (bus.refCount === 0) {
          disposeSharedDroneEffectBus(bus);
        }
      },
      (bus.effectChain.tailSeconds + CLEANUP_DELAY_SECONDS) * 1000,
    );
  }

  function warmPresetWaves(context: AudioContext) {
    Object.values(audioPresets).forEach((preset) => {
      WARMUP_MIDI_NOTES.forEach((midiNote) => {
        const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);

        if (canUseNativeSineOscillator(voiceConfig.partials)) {
          return;
        }

        harmonicWaveCache.getPeriodicWave(context, voiceConfig.partials);
      });
    });
  }

  function primeContext(context: AudioContext) {
    const destination = getAudioMixer(context).getInput(DEFAULT_AUDIO_USE);

    if (primedContext === context) {
      return;
    }

    primedContext = context;
    warmPresetWaves(context);

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const stopTime = startTime + SILENT_UNLOCK_PULSE_SECONDS;

    gain.gain.setValueAtTime(0, startTime);
    oscillator.connect(gain);
    gain.connect(destination);
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
    const cleanupTimeWithTail = cleanupTime + voice.tailSeconds;
    const delaySeconds =
      Math.max(0, cleanupTimeWithTail - context.currentTime) +
      CLEANUP_DELAY_SECONDS;

    window.setTimeout(() => {
      voice.disconnect();
      activeVoices.delete(voice.handle);
    }, delaySeconds * 1000);
  }

  function createVoice({
    context,
    destination,
    frequency,
    insertEffects,
    midiNote,
    onDisconnect,
    preset,
    startTime,
    tailSeconds,
    use,
    velocity,
  }: {
    context: AudioContext;
    destination?: AudioNode;
    frequency: number;
    insertEffects?: readonly VoiceInsertEffectConfig[];
    midiNote: number;
    onDisconnect?: () => void;
    preset: AudioPreset;
    startTime: number;
    tailSeconds?: number;
    use: AudioUse;
    velocity: number | undefined;
  }) {
    const handle = `voice-${nextVoiceId++}` as AudioVoiceHandle;
    const voice = createHarmonicVoice({
      context,
      destination: destination ?? getAudioMixer(context).getInput(use),
      frequency,
      getPeriodicWave: harmonicWaveCache.getPeriodicWave,
      handle,
      insertEffects,
      midiNote,
      onDisconnect,
      onEnded: scheduleVoiceCleanup,
      preset,
      startTime,
      tailSeconds,
      velocity,
    });

    if (!voice) {
      return undefined;
    }

    activeVoices.set(handle, voice);
    return voice;
  }

  function playNoteWithContext(
    context: AudioContext,
    request: PlayNoteRequest,
  ) {
    const use = request.use ?? DEFAULT_AUDIO_USE;
    const preset = resolveAudioPreset(
      request.presetId,
      getDefaultAudioPresetId(use),
    );
    const durationSeconds = Math.max(
      MIN_NOTE_DURATION_SECONDS,
      normalizePositiveNumber(
        request.durationSeconds ?? preset.defaultDurationSeconds,
        MIN_NOTE_DURATION_SECONDS,
      ),
    );
    const startTime = context.currentTime;
    const voice = createVoice({
      context,
      frequency: midiToFrequency(request.midiNote, request.concertPitchHz),
      midiNote: request.midiNote,
      preset,
      startTime,
      use,
      velocity: request.velocity,
    });

    if (!voice) {
      return undefined;
    }

    scheduleOneShotEnvelope({
      durationSeconds,
      envelope: preset.voice.envelope,
      param: voice.envelope.gain,
      peakGain: voice.peakGain,
      startTime,
    });
    voice.getGainAtTime = (sampleTime) =>
      getOneShotEnvelopeGainAtTime({
        durationSeconds,
        envelope: preset.voice.envelope,
        peakGain: voice.peakGain,
        sampleTime,
        startTime,
      });

    const stopTime = startTime + durationSeconds;
    voice.scheduleStop(stopTime);
    scheduleVoiceCleanup(voice, stopTime);

    return voice.handle;
  }

  function startDroneWithContext(context: AudioContext, request: DroneRequest) {
    const midiNotes = [
      ...new Set(request.midiNotes.filter(isPlayableMidiNote)),
    ];

    if (midiNotes.length === 0) {
      return undefined;
    }

    const use = request.use ?? DEFAULT_DRONE_USE;
    const preset = resolveAudioPreset(
      request.presetId,
      getDefaultAudioPresetId(use),
    );
    const startTime = context.currentTime;
    const voices = midiNotes.reduce<ActiveVoice[]>((nextVoices, midiNote) => {
      const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);
      const sharedEffects = getSharedDroneInsertEffects(
        voiceConfig.insertEffects,
      );
      const perVoiceEffects = getPerVoiceDroneInsertEffects(
        voiceConfig.insertEffects,
      );
      const sharedBus =
        sharedEffects.length > 0
          ? getSharedDroneEffectBus({
              context,
              effects: sharedEffects,
              use,
            })
          : undefined;
      const voice = createVoice({
        context,
        destination: sharedBus?.input,
        frequency: midiToFrequency(midiNote, request.concertPitchHz),
        insertEffects: perVoiceEffects,
        midiNote,
        onDisconnect:
          sharedBus === undefined
            ? undefined
            : () => releaseSharedDroneEffectBus(sharedBus),
        preset,
        startTime,
        tailSeconds: sharedBus?.effectChain.tailSeconds,
        use,
        velocity: request.velocity,
      });

      if (!voice) {
        if (sharedBus && sharedBus.refCount === 0) {
          disposeSharedDroneEffectBus(sharedBus);
        }

        return nextVoices;
      }

      if (sharedBus) {
        retainSharedDroneEffectBus(sharedBus);
      }

      nextVoices.push(voice);
      return nextVoices;
    }, []);

    if (voices.length === 0) {
      return undefined;
    }

    const handle = `drone-${nextDroneId++}` as DroneHandle;
    activeDrones.set(handle, { handle, voices });
    voices.forEach((voice) =>
      scheduleAttackDecayEnvelope({
        envelope: preset.voice.envelope,
        param: voice.envelope.gain,
        peakGain: voice.peakGain,
        startTime,
      }),
    );

    return handle;
  }

  function runWithReadyContext<T>(operation: (context: AudioContext) => T) {
    const runningContext = getRunningAudioContext();

    if (runningContext) {
      primeContext(runningContext);
      return Promise.resolve(operation(runningContext));
    }

    return getReadyAudioContext().then((context) => {
      if (!context) {
        return undefined;
      }

      primeContext(context);
      return operation(context);
    });
  }

  return {
    getMasterAmbiencePresetId: () => masterAmbiencePresetId,
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

      return runWithReadyContext((context) =>
        playNoteWithContext(context, request),
      );
    },
    setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => {
      masterAmbiencePresetId = presetId;
      audioMixer?.setMasterAmbiencePresetId(presetId);
    },
    startDrone: (request: DroneRequest) => {
      if (!request.midiNotes.some(isPlayableMidiNote)) {
        return Promise.resolve(undefined);
      }

      return runWithReadyContext((context) =>
        startDroneWithContext(context, request),
      );
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
