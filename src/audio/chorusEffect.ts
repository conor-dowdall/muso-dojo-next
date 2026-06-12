import {
  clampNumber,
  disconnectAudioNodes,
  normalizeBoundedNonNegativeNumber,
  normalizeBoundedPositiveNumber,
  type AudioEffectInstance,
} from "./effectPrimitives";
import { clampUnit, normalizePositiveNumber } from "./numeric";
import { type ChorusEffectConfig } from "./types";

const CHORUS_DEFAULT_DELAY_SECONDS = 0.018;
const CHORUS_MAX_DELAY_SECONDS = 0.05;
const CHORUS_MAX_DEPTH_SECONDS = 0.012;
const CHORUS_MIN_RATE_HZ = 0.02;
const CHORUS_MAX_RATE_HZ = 8;

export function getChorusTailSeconds(config: ChorusEffectConfig) {
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

export function createChorusEffect({
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

      disconnectAudioNodes(nodes);
    },
    input,
    output,
    tailSeconds: getChorusTailSeconds(config),
  };
}
