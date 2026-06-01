import { clampUnit } from "./numeric";
import { type DistortionConfig } from "./types";

const CURVE_SAMPLE_COUNT = 1024;
const DEFAULT_OVERSAMPLE = "2x" satisfies OverSampleType;

const curveCache = new Map<string, Float32Array<ArrayBuffer>>();

function getSoftClipCurve(amount: number) {
  const normalizedAmount = clampUnit(amount, 0);

  if (normalizedAmount <= 0) {
    return undefined;
  }

  const cacheKey = normalizedAmount.toFixed(4);
  const cachedCurve = curveCache.get(cacheKey);

  if (cachedCurve) {
    return cachedCurve;
  }

  const curve = new Float32Array(
    new ArrayBuffer(CURVE_SAMPLE_COUNT * Float32Array.BYTES_PER_ELEMENT),
  );
  const drive = 1 + normalizedAmount * 24;
  const normalization = Math.tanh(drive);

  for (let index = 0; index < CURVE_SAMPLE_COUNT; index++) {
    const x = (index / (CURVE_SAMPLE_COUNT - 1)) * 2 - 1;
    curve[index] = Math.tanh(x * drive) / normalization;
  }

  curveCache.set(cacheKey, curve);
  return curve;
}

export function createDistortionEffect({
  config,
  context,
}: {
  config: DistortionConfig;
  context: AudioContext;
}) {
  const curve = getSoftClipCurve(config.amount);
  const wetMix = clampUnit(config.mix, 1);

  if (!curve || wetMix <= 0) {
    return undefined;
  }

  const input = context.createGain();
  const output = context.createGain();
  const shaper = context.createWaveShaper();
  const nodes: AudioNode[] = [input, output, shaper];

  shaper.curve = curve;
  shaper.oversample = config.oversample ?? DEFAULT_OVERSAMPLE;

  if (wetMix >= 1) {
    input.connect(shaper);
    shaper.connect(output);
  } else {
    const dryGain = context.createGain();
    const wetGain = context.createGain();

    dryGain.gain.setValueAtTime(1 - wetMix, context.currentTime);
    wetGain.gain.setValueAtTime(wetMix, context.currentTime);
    input.connect(dryGain);
    dryGain.connect(output);
    input.connect(shaper);
    shaper.connect(wetGain);
    wetGain.connect(output);
    nodes.push(dryGain, wetGain);
  }

  return {
    dispose: () => nodes.forEach((node) => node.disconnect()),
    input,
    output,
    tailSeconds: 0,
  };
}
