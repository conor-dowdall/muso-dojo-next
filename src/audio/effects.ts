import { createDistortionEffect } from "./distortion";
import {
  clampUnit,
  normalizeNonNegativeNumber,
  normalizePositiveNumber,
} from "./numeric";
import {
  type AudioEffectConfig,
  type ChorusEffectConfig,
  type DelayEffectConfig,
  type ReverbEffectConfig,
} from "./types";

const CHORUS_DEFAULT_DELAY_SECONDS = 0.018;
const CHORUS_MAX_DELAY_SECONDS = 0.05;
const CHORUS_MAX_DEPTH_SECONDS = 0.012;
const CHORUS_MIN_RATE_HZ = 0.02;
const CHORUS_MAX_RATE_HZ = 8;
const DELAY_DEFAULT_TIME_SECONDS = 0.24;
const DELAY_MAX_FEEDBACK = 0.92;
const DELAY_MAX_SECONDS = 2;
const DELAY_TAIL_FLOOR = 0.001;
const REVERB_DEFAULT_TONE_HZ = 6500;
const REVERB_MAX_DECAY_SECONDS = 8;
const REVERB_MAX_PRE_DELAY_SECONDS = 0.18;

export interface AudioEffectInstance {
  dispose: () => void;
  input: AudioNode;
  output: AudioNode;
  tailSeconds: number;
}

export interface ConnectedAudioEffectChain {
  dispose: () => void;
  tailSeconds: number;
}

const reverbImpulseCache = new WeakMap<
  AudioContext,
  Map<string, AudioBuffer>
>();

function disconnectNodes(nodes: readonly AudioNode[]) {
  nodes.forEach((node) => node.disconnect());
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBoundedPositiveNumber({
  fallback,
  max,
  value,
}: {
  fallback: number;
  max: number;
  value: number | undefined;
}) {
  return Math.min(max, normalizePositiveNumber(value, fallback));
}

function normalizeBoundedNonNegativeNumber({
  fallback,
  max,
  value,
}: {
  fallback: number;
  max: number;
  value: number | undefined;
}) {
  return Math.min(max, normalizeNonNegativeNumber(value, fallback));
}

function getDelayTailSeconds(config: DelayEffectConfig) {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return 0;
  }

  const timeSeconds = normalizeBoundedPositiveNumber({
    fallback: DELAY_DEFAULT_TIME_SECONDS,
    max: DELAY_MAX_SECONDS,
    value: config.timeSeconds,
  });
  const feedback = Math.min(DELAY_MAX_FEEDBACK, clampUnit(config.feedback, 0));

  if (feedback <= DELAY_TAIL_FLOOR) {
    return timeSeconds;
  }

  const echoCount = Math.ceil(Math.log(DELAY_TAIL_FLOOR) / Math.log(feedback));
  return timeSeconds * Math.max(1, echoCount);
}

function createDelayEffect({
  config,
  context,
}: {
  config: DelayEffectConfig;
  context: AudioContext;
}): AudioEffectInstance | undefined {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return undefined;
  }

  const feedback = Math.min(DELAY_MAX_FEEDBACK, clampUnit(config.feedback, 0));
  const timeSeconds = normalizeBoundedPositiveNumber({
    fallback: DELAY_DEFAULT_TIME_SECONDS,
    max: DELAY_MAX_SECONDS,
    value: config.timeSeconds,
  });
  const input = context.createGain();
  const output = context.createGain();
  const dryGain = context.createGain();
  const wetGain = context.createGain();
  const delay = context.createDelay(DELAY_MAX_SECONDS);
  const feedbackGain = context.createGain();

  dryGain.gain.setValueAtTime(1 - mix, context.currentTime);
  wetGain.gain.setValueAtTime(mix, context.currentTime);
  delay.delayTime.setValueAtTime(timeSeconds, context.currentTime);
  feedbackGain.gain.setValueAtTime(feedback, context.currentTime);

  input.connect(dryGain);
  dryGain.connect(output);
  input.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(output);

  if (feedback > 0) {
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
  }

  return {
    dispose: () =>
      disconnectNodes([input, output, dryGain, wetGain, delay, feedbackGain]),
    input,
    output,
    tailSeconds: getDelayTailSeconds(config),
  };
}

function getChorusTailSeconds(config: ChorusEffectConfig) {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return 0;
  }

  const delaySeconds = normalizeBoundedPositiveNumber({
    fallback: CHORUS_DEFAULT_DELAY_SECONDS,
    max: CHORUS_MAX_DELAY_SECONDS,
    value: config.delaySeconds,
  });
  const depthSeconds = normalizeBoundedNonNegativeNumber({
    fallback: 0,
    max: CHORUS_MAX_DEPTH_SECONDS,
    value: config.depthSeconds,
  });

  return delaySeconds + depthSeconds;
}

function createChorusEffect({
  config,
  context,
}: {
  config: ChorusEffectConfig;
  context: AudioContext;
}): AudioEffectInstance | undefined {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return undefined;
  }

  const delaySeconds = normalizeBoundedPositiveNumber({
    fallback: CHORUS_DEFAULT_DELAY_SECONDS,
    max: CHORUS_MAX_DELAY_SECONDS,
    value: config.delaySeconds,
  });
  const depthSeconds = normalizeBoundedNonNegativeNumber({
    fallback: 0,
    max: CHORUS_MAX_DEPTH_SECONDS,
    value: config.depthSeconds,
  });
  const feedback = Math.min(0.6, clampUnit(config.feedback, 0));
  const rateHz = clampNumber(
    normalizePositiveNumber(config.rateHz, 0.35),
    CHORUS_MIN_RATE_HZ,
    CHORUS_MAX_RATE_HZ,
  );
  const input = context.createGain();
  const output = context.createGain();
  const dryGain = context.createGain();
  const wetGain = context.createGain();
  const delay = context.createDelay(
    CHORUS_MAX_DELAY_SECONDS + CHORUS_MAX_DEPTH_SECONDS,
  );
  const feedbackGain = context.createGain();
  const lfo = context.createOscillator();
  const lfoDepth = context.createGain();
  const nodes = [
    input,
    output,
    dryGain,
    wetGain,
    delay,
    feedbackGain,
    lfo,
    lfoDepth,
  ];
  let disposed = false;

  dryGain.gain.setValueAtTime(1 - mix, context.currentTime);
  wetGain.gain.setValueAtTime(mix, context.currentTime);
  delay.delayTime.setValueAtTime(delaySeconds, context.currentTime);
  feedbackGain.gain.setValueAtTime(feedback, context.currentTime);
  lfo.frequency.setValueAtTime(rateHz, context.currentTime);
  lfoDepth.gain.setValueAtTime(depthSeconds, context.currentTime);

  input.connect(dryGain);
  dryGain.connect(output);
  input.connect(delay);
  delay.connect(wetGain);
  wetGain.connect(output);
  lfo.connect(lfoDepth);
  lfoDepth.connect(delay.delayTime);

  if (feedback > 0) {
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
  }

  lfo.start(context.currentTime);

  return {
    dispose: () => {
      if (disposed) {
        return;
      }

      disposed = true;

      try {
        lfo.stop();
      } catch {
        // The oscillator may already be stopped during teardown.
      }

      disconnectNodes(nodes);
    },
    input,
    output,
    tailSeconds: getChorusTailSeconds(config),
  };
}

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

function getReverbTailSeconds(config: ReverbEffectConfig) {
  const mix = clampUnit(config.mix, 0);

  if (mix <= 0) {
    return 0;
  }

  return getReverbPreDelaySeconds(config) + getReverbDecaySeconds(config);
}

function createReverbEffect({
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
    dispose: () => disconnectNodes(nodes),
    input,
    output,
    tailSeconds: getReverbTailSeconds(config),
  };
}

export function getAudioEffectConfigTailSeconds(config: AudioEffectConfig) {
  switch (config.type) {
    case "chorus":
      return getChorusTailSeconds(config);
    case "delay":
      return getDelayTailSeconds(config);
    case "distortion":
      return 0;
    case "reverb":
      return getReverbTailSeconds(config);
  }
}

export function getAudioEffectChainTailSeconds(
  effects: readonly AudioEffectConfig[],
) {
  return effects.reduce(
    (tailSeconds, effect) =>
      tailSeconds + getAudioEffectConfigTailSeconds(effect),
    0,
  );
}

export function createAudioEffect({
  config,
  context,
}: {
  config: AudioEffectConfig;
  context: AudioContext;
}): AudioEffectInstance | undefined {
  switch (config.type) {
    case "chorus":
      return createChorusEffect({ config, context });
    case "delay":
      return createDelayEffect({ config, context });
    case "distortion":
      return createDistortionEffect({ config, context });
    case "reverb":
      return createReverbEffect({ config, context });
  }
}

export function connectAudioEffectChain({
  context,
  destination,
  effects,
  source,
}: {
  context: AudioContext;
  destination: AudioNode;
  effects: readonly AudioEffectConfig[] | undefined;
  source: AudioNode;
}): ConnectedAudioEffectChain {
  const instances: AudioEffectInstance[] = [];
  let currentOutput = source;

  effects?.forEach((config) => {
    const effect = createAudioEffect({ config, context });

    if (!effect) {
      return;
    }

    currentOutput.connect(effect.input);
    currentOutput = effect.output;
    instances.push(effect);
  });

  currentOutput.connect(destination);

  return {
    dispose: () => instances.forEach((effect) => effect.dispose()),
    tailSeconds: instances.reduce(
      (tailSeconds, effect) => tailSeconds + effect.tailSeconds,
      0,
    ),
  };
}
