import {
  connectAudioEffectChain,
  type ConnectedAudioEffectChain,
} from "./effects";
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
  const compressor = context.createDynamicsCompressor();
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
  let currentMasterAmbiencePresetId = masterAmbiencePresetId;
  let masterEffectChain: ConnectedAudioEffectChain = emptyEffectChain;

  configureMasterCompressor(compressor, context);
  masterInput.gain.setValueAtTime(MASTER_OUTPUT_GAIN, context.currentTime);
  compressor.connect(context.destination);

  function reconnectMasterAmbience() {
    masterInput.disconnect();
    masterEffectChain.dispose();
    masterEffectChain = connectAudioEffectChain({
      context,
      destination: compressor,
      effects: getMasterAmbiencePreset(currentMasterAmbiencePresetId).effects,
      source: masterInput,
    });
  }

  reconnectMasterAmbience();

  return {
    dispose: () => {
      Object.values(useInputs).forEach((input) => input.disconnect());
      masterInput.disconnect();
      masterEffectChain.dispose();
      compressor.disconnect();
    },
    getInput: (use) => useInputs[use],
    getMasterAmbiencePresetId: () => currentMasterAmbiencePresetId,
    setMasterAmbiencePresetId: (presetId) => {
      if (presetId === currentMasterAmbiencePresetId) {
        return;
      }

      currentMasterAmbiencePresetId = presetId;
      reconnectMasterAmbience();
    },
  };
}
