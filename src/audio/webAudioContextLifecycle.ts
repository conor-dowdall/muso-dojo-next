import { getAudioContextConstructor } from "./audioContext";
import { canUseNativeSineOscillator } from "./harmonicWave";
import { DEFAULT_MASTER_AMBIENCE_PRESET_ID } from "./masterAmbience";
import { createAudioMixer, type AudioMixer } from "./mixer";
import { audioPresets } from "./presets";
import {
  type AudioClockSnapshot,
  type AudioUse,
  type HarmonicPartialConfig,
  type MasterAmbiencePresetId,
} from "./types";
import { resolveHarmonicVoiceConfig } from "./voiceConfig";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const CLEANUP_DELAY_SECONDS = 0.05;
const SILENT_UNLOCK_PULSE_SECONDS = 0.01;
const AUDIO_RENDER_QUANTUM_FRAMES = 128;
const ONE_SHOT_RAMP_RENDER_QUANTA = 1;
const MIN_SCHEDULE_LOOKAHEAD_SECONDS = 0.006;
const WARMUP_MIDI_NOTES = [36, 48, 60, 72] as const;

type GetPeriodicWave = (
  context: AudioContext,
  partials: readonly HarmonicPartialConfig[],
) => PeriodicWave | undefined;

export function getScheduleLookaheadSeconds(context: AudioContext) {
  return Math.max(
    MIN_SCHEDULE_LOOKAHEAD_SECONDS,
    (AUDIO_RENDER_QUANTUM_FRAMES * 2) / context.sampleRate,
  );
}

export function getOneShotMinimumRampSeconds(context: AudioContext) {
  return (
    (AUDIO_RENDER_QUANTUM_FRAMES * ONE_SHOT_RAMP_RENDER_QUANTA) /
    context.sampleRate
  );
}

export function createWebAudioContextLifecycle({
  getPeriodicWave,
  onBeforeReset,
  onReset,
}: {
  getPeriodicWave: GetPeriodicWave;
  onBeforeReset: () => void;
  onReset: () => void;
}) {
  let audioContext: AudioContext | undefined;
  let masterAmbiencePresetId: MasterAmbiencePresetId =
    DEFAULT_MASTER_AMBIENCE_PRESET_ID;
  let audioMixer: AudioMixer | undefined;
  let primedContext: AudioContext | undefined;
  let readyContextPromise: Promise<AudioContext | undefined> | undefined;

  function clearContextReferences() {
    try {
      onBeforeReset();
      audioMixer?.dispose();
    } catch {
      // The browser may already have torn down the underlying audio graph.
    }

    audioContext = undefined;
    audioMixer = undefined;
    primedContext = undefined;
    readyContextPromise = undefined;
    onReset();
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
      const createdContext = audioContext;

      createdContext.addEventListener("statechange", () => {
        if (
          createdContext.state === "closed" &&
          audioContext === createdContext
        ) {
          clearContextReferences();
        }
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

  function warmPresetWaves(context: AudioContext) {
    Object.values(audioPresets).forEach((preset) => {
      WARMUP_MIDI_NOTES.forEach((midiNote) => {
        const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);

        if (canUseNativeSineOscillator(voiceConfig.partials)) {
          return;
        }

        getPeriodicWave(context, voiceConfig.partials);
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

  function getOutputClock(context: AudioContext): AudioClockSnapshot {
    const outputTimestamp = context.getOutputTimestamp?.();
    const outputContextTime = outputTimestamp?.contextTime;
    const outputPerformanceTime = outputTimestamp?.performanceTime;

    if (
      typeof outputContextTime === "number" &&
      Number.isFinite(outputContextTime) &&
      typeof outputPerformanceTime === "number" &&
      Number.isFinite(outputPerformanceTime)
    ) {
      return {
        contextTime: outputContextTime,
        performanceTime: outputPerformanceTime,
      };
    }

    return {
      contextTime: context.currentTime,
      performanceTime:
        typeof performance === "undefined" ? 0 : performance.now(),
    };
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
    clearContextReferences,
    getAudioMixer,
    getMasterAmbiencePresetId: () => masterAmbiencePresetId,
    getOutputClock,
    getReadyAudioContext,
    getRunningAudioContext,
    isSupported: () => getAudioContextConstructor() !== undefined,
    primeContext,
    runWithReadyContext,
    setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => {
      masterAmbiencePresetId = presetId;
      audioMixer?.setMasterAmbiencePresetId(presetId);
    },
  };
}
