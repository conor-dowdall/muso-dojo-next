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

export function connectDistortion({
  config,
  context,
  destination,
  source,
}: {
  config: DistortionConfig | undefined;
  context: AudioContext;
  destination: AudioNode;
  source: AudioNode;
}) {
  const curve = config ? getSoftClipCurve(config.amount) : undefined;
  const wetMix = clampUnit(config?.mix, 1);

  if (!curve || wetMix <= 0) {
    source.connect(destination);
    return [];
  }

  const shaper = context.createWaveShaper();
  shaper.curve = curve;
  shaper.oversample = config?.oversample ?? DEFAULT_OVERSAMPLE;

  if (wetMix >= 1) {
    source.connect(shaper);
    shaper.connect(destination);
    return [shaper];
  }

  const dryGain = context.createGain();
  const wetGain = context.createGain();

  dryGain.gain.setValueAtTime(1 - wetMix, context.currentTime);
  wetGain.gain.setValueAtTime(wetMix, context.currentTime);

  source.connect(dryGain);
  dryGain.connect(destination);
  source.connect(shaper);
  shaper.connect(wetGain);
  wetGain.connect(destination);

  return [dryGain, shaper, wetGain];
}
