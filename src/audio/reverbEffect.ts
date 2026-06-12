import {
  disconnectAudioNodes,
  normalizeBoundedNonNegativeNumber,
  normalizeBoundedPositiveNumber,
  type AudioEffectInstance,
} from "./effectPrimitives";
import { clampUnit } from "./numeric";
import { type ReverbEffectConfig } from "./types";

const REVERB_DEFAULT_TONE_HZ = 6500;
const REVERB_MAX_DECAY_SECONDS = 8;
const REVERB_MAX_PRE_DELAY_SECONDS = 0.18;

const reverbImpulseCache = new WeakMap<
  AudioContext,
  Map<string, AudioBuffer>
>();

function getReverbDecaySeconds(config: ReverbEffectConfig) {
  return normalizeBoundedPositiveNumber({
    fallback: 1.2,
    max: REVERB_MAX_DECAY_SECONDS,
    value: config.decaySeconds,
  });
}

function getReverbPreDelaySeconds(config: ReverbEffectConfig) {
  return normalizeBoundedNonNegativeNumber({
    fallback: 0,
    max: REVERB_MAX_PRE_DELAY_SECONDS,
    value: config.preDelaySeconds,
  });
}

function getReverbImpulseBuffer(
  context: AudioContext,
  config: ReverbEffectConfig,
) {
  const decaySeconds = getReverbDecaySeconds(config);
  const cacheKey = `${context.sampleRate}:${decaySeconds.toFixed(3)}`;
  const contextCache =
    reverbImpulseCache.get(context) ?? new Map<string, AudioBuffer>();
  const cachedBuffer = contextCache.get(cacheKey);

  if (cachedBuffer) {
    return cachedBuffer;
  }

  const sampleCount = Math.max(
    1,
    Math.floor(context.sampleRate * decaySeconds),
  );
  const buffer = context.createBuffer(2, sampleCount, context.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    let smoothedNoise = 0;

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
      const progress = sampleIndex / sampleCount;
      const envelope = (1 - progress) ** 2.2;
      const noise = Math.random() * 2 - 1;

      smoothedNoise = smoothedNoise * 0.58 + noise * 0.42;
      samples[sampleIndex] = smoothedNoise * envelope;
    }
  }

  contextCache.set(cacheKey, buffer);
  reverbImpulseCache.set(context, contextCache);

  return buffer;
}

export function getReverbTailSeconds(config: ReverbEffectConfig) {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return 0;
  }

  return getReverbPreDelaySeconds(config) + getReverbDecaySeconds(config);
}

export function createReverbEffect({
  config,
  context,
}: {
  config: ReverbEffectConfig;
  context: AudioContext;
}): AudioEffectInstance | undefined {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return undefined;
  }

  const preDelaySeconds = getReverbPreDelaySeconds(config);
  const toneHz = normalizeBoundedPositiveNumber({
    fallback: REVERB_DEFAULT_TONE_HZ,
    max: 18000,
    value: config.toneHz,
  });
  const input = context.createGain();
  const output = context.createGain();
  const dryGain = context.createGain();
  const wetGain = context.createGain();
  const convolver = context.createConvolver();
  const tone = context.createBiquadFilter();
  const nodes: AudioNode[] = [input, output, dryGain, wetGain, convolver, tone];

  dryGain.gain.setValueAtTime(1 - mix, context.currentTime);
  wetGain.gain.setValueAtTime(mix, context.currentTime);
  convolver.buffer = getReverbImpulseBuffer(context, config);
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(toneHz, context.currentTime);
  tone.Q.setValueAtTime(0.6, context.currentTime);

  input.connect(dryGain);
  dryGain.connect(output);

  if (preDelaySeconds > 0) {
    const preDelay = context.createDelay(REVERB_MAX_PRE_DELAY_SECONDS);

    preDelay.delayTime.setValueAtTime(preDelaySeconds, context.currentTime);
    input.connect(preDelay);
    preDelay.connect(convolver);
    nodes.push(preDelay);
  } else {
    input.connect(convolver);
  }

  convolver.connect(tone);
  tone.connect(wetGain);
  wetGain.connect(output);

  return {
    dispose: () => disconnectAudioNodes(nodes),
    input,
    output,
    tailSeconds: getReverbTailSeconds(config),
  };
}
