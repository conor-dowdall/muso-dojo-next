import {
  connectAudioEffectChain,
  type ConnectedAudioEffectChain,
} from "./effects";
import { releaseAudioParam } from "./envelope";
import { getMasterAmbiencePreset } from "./masterAmbience";
import { type AudioUse, type MasterAmbiencePresetId } from "./types";

const AUDIO_USE_BUS_GAINS = {
  preview: 1,
  tuning: 0.82,
  drone: 0.86,
  exercise: 1,
} as const satisfies Record<AudioUse, number>;

const MASTER_COMPRESSOR_ATTACK_SECONDS = 0.004;
const MASTER_COMPRESSOR_KNEE_DB = 18;
const MASTER_COMPRESSOR_RATIO = 4;
const MASTER_COMPRESSOR_RELEASE_SECONDS = 0.16;
const MASTER_COMPRESSOR_THRESHOLD_DB = -10;
const MASTER_OUTPUT_GAIN = 0.72;
const MASTER_RECONFIGURE_FADE_OUT_SECONDS = 0.05;
const MASTER_RECONFIGURE_FADE_IN_SECONDS = 0.07;

const emptyEffectChain: ConnectedAudioEffectChain = {
  dispose: () => undefined,
  tailSeconds: 0,
};

export interface AudioMixer {
  dispose: () => void;
  getInput: (use: AudioUse) => GainNode;
  getMasterAmbiencePresetId: () => MasterAmbiencePresetId;
  setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => void;
}

function configureMasterCompressor(
  compressor: DynamicsCompressorNode,
  context: AudioContext,
) {
  compressor.threshold.setValueAtTime(
    MASTER_COMPRESSOR_THRESHOLD_DB,
    context.currentTime,
  );
  compressor.knee.setValueAtTime(
    MASTER_COMPRESSOR_KNEE_DB,
    context.currentTime,
  );
  compressor.ratio.setValueAtTime(MASTER_COMPRESSOR_RATIO, context.currentTime);
  compressor.attack.setValueAtTime(
    MASTER_COMPRESSOR_ATTACK_SECONDS,
    context.currentTime,
  );
  compressor.release.setValueAtTime(
    MASTER_COMPRESSOR_RELEASE_SECONDS,
    context.currentTime,
  );
}

function createUseInput({
  context,
  gain,
  masterInput,
}: {
  context: AudioContext;
  gain: number;
  masterInput: AudioNode;
}) {
  const input = context.createGain();

  input.gain.setValueAtTime(gain, context.currentTime);
  input.connect(masterInput);

  return input;
}

export function createAudioMixer({
  context,
  masterAmbiencePresetId,
}: {
  context: AudioContext;
  masterAmbiencePresetId: MasterAmbiencePresetId;
}): AudioMixer {
  const masterInput = context.createGain();
  const useInputs = {
    preview: createUseInput({
      context,
      gain: AUDIO_USE_BUS_GAINS.preview,
      masterInput,
    }),
    tuning: createUseInput({
      context,
      gain: AUDIO_USE_BUS_GAINS.tuning,
      masterInput,
    }),
    drone: createUseInput({
      context,
      gain: AUDIO_USE_BUS_GAINS.drone,
      masterInput,
    }),
    exercise: createUseInput({
      context,
      gain: AUDIO_USE_BUS_GAINS.exercise,
      masterInput,
    }),
  } satisfies Record<AudioUse, GainNode>;
  let compressor: DynamicsCompressorNode | undefined;
  let compressorOutputConnected = false;
  let currentMasterAmbiencePresetId = masterAmbiencePresetId;
  let masterEffectChain: ConnectedAudioEffectChain = emptyEffectChain;
  let ambienceTransitionTimer: number | undefined;
  let ambienceTransitionRevision = 0;

  masterInput.gain.setValueAtTime(MASTER_OUTPUT_GAIN, context.currentTime);

  function getMasterCompressor() {
    if (!compressor) {
      compressor = context.createDynamicsCompressor();
      configureMasterCompressor(compressor, context);
    }

    return compressor;
  }

  function connectCompressorOutput() {
    const masterCompressor = getMasterCompressor();

    if (!compressorOutputConnected) {
      masterCompressor.connect(context.destination);
      compressorOutputConnected = true;
    }

    return masterCompressor;
  }

  function disconnectCompressorOutput() {
    if (!compressor || !compressorOutputConnected) {
      return;
    }

    compressor.disconnect();
    compressorOutputConnected = false;
  }

  function reconnectMasterAmbience() {
    const ambiencePreset = getMasterAmbiencePreset(
      currentMasterAmbiencePresetId,
    );

    masterInput.disconnect();
    masterEffectChain.dispose();

    if (ambiencePreset.effects.length === 0) {
      disconnectCompressorOutput();
      masterEffectChain = emptyEffectChain;
      masterInput.connect(context.destination);
      return;
    }

    masterEffectChain = connectAudioEffectChain({
      context,
      destination: connectCompressorOutput(),
      effects: ambiencePreset.effects,
      source: masterInput,
    });
  }

  reconnectMasterAmbience();

  return {
    dispose: () => {
      if (ambienceTransitionTimer !== undefined) {
        window.clearTimeout(ambienceTransitionTimer);
      }

      Object.values(useInputs).forEach((input) => input.disconnect());
      masterInput.disconnect();
      masterEffectChain.dispose();
      compressor?.disconnect();
    },
    getInput: (use) => useInputs[use],
    getMasterAmbiencePresetId: () => currentMasterAmbiencePresetId,
    setMasterAmbiencePresetId: (presetId) => {
      if (presetId === currentMasterAmbiencePresetId) {
        return;
      }

      currentMasterAmbiencePresetId = presetId;
      ambienceTransitionRevision += 1;
      const transitionRevision = ambienceTransitionRevision;
      const fadeStart = context.currentTime;
      const fadeEnd = fadeStart + MASTER_RECONFIGURE_FADE_OUT_SECONDS;

      if (ambienceTransitionTimer !== undefined) {
        window.clearTimeout(ambienceTransitionTimer);
      }

      releaseAudioParam({
        fallbackGain: MASTER_OUTPUT_GAIN,
        param: masterInput.gain,
        stopTime: fadeStart,
      });
      masterInput.gain.linearRampToValueAtTime(0, fadeEnd);
      ambienceTransitionTimer = window.setTimeout(() => {
        ambienceTransitionTimer = undefined;

        if (transitionRevision !== ambienceTransitionRevision) {
          return;
        }

        reconnectMasterAmbience();

        const fadeInStart = context.currentTime;
        const fadeInEnd = fadeInStart + MASTER_RECONFIGURE_FADE_IN_SECONDS;

        masterInput.gain.cancelScheduledValues(fadeInStart);
        masterInput.gain.setValueAtTime(0, fadeInStart);
        masterInput.gain.linearRampToValueAtTime(MASTER_OUTPUT_GAIN, fadeInEnd);
      }, MASTER_RECONFIGURE_FADE_OUT_SECONDS * 1000);
    },
  };
}
