import {
  disconnectAudioNodes,
  normalizeBoundedPositiveNumber,
  type AudioEffectInstance,
} from "./effectPrimitives";
import { clampUnit } from "./numeric";
import { type DelayEffectConfig } from "./types";

const DELAY_DEFAULT_TIME_SECONDS = 0.24;
const DELAY_MAX_FEEDBACK = 0.92;
const DELAY_MAX_SECONDS = 2;
const DELAY_TAIL_FLOOR = 0.001;

export function getDelayTailSeconds(config: DelayEffectConfig) {
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

export function createDelayEffect({
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
      disconnectAudioNodes([
        input,
        output,
        dryGain,
        wetGain,
        delay,
        feedbackGain,
      ]),
    input,
    output,
    tailSeconds: getDelayTailSeconds(config),
  };
}
