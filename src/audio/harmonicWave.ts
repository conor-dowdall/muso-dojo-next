import { type HarmonicPartialConfig } from "./types";

function normalizeHarmonicPartials(partials: readonly HarmonicPartialConfig[]) {
  const gainByMultiple = new Map<number, number>();

  partials.forEach((partial) => {
    if (
      !Number.isSafeInteger(partial.multiple) ||
      partial.multiple <= 0 ||
      !Number.isFinite(partial.gain) ||
      partial.gain <= 0
    ) {
      return;
    }

    gainByMultiple.set(
      partial.multiple,
      (gainByMultiple.get(partial.multiple) ?? 0) + partial.gain,
    );
  });

  return [...gainByMultiple]
    .sort(([leftMultiple], [rightMultiple]) => leftMultiple - rightMultiple)
    .map(([multiple, gain]) => ({ multiple, gain }));
}

function getPartialsCacheKey(partials: readonly HarmonicPartialConfig[]) {
  return partials
    .map((partial) => `${partial.multiple}:${partial.gain}`)
    .join("|");
}

function getPartialGainScale(partials: readonly HarmonicPartialConfig[]) {
  const totalGain = partials.reduce(
    (total, partial) => total + partial.gain,
    0,
  );
  return totalGain > 0 ? 1 / totalGain : 1;
}

export function createHarmonicWaveCache() {
  const periodicWaveCache = new WeakMap<
    AudioContext,
    Map<string, PeriodicWave>
  >();

  function getPeriodicWave(
    context: AudioContext,
    rawPartials: readonly HarmonicPartialConfig[],
  ) {
    const partials = normalizeHarmonicPartials(rawPartials);

    if (partials.length === 0) {
      return undefined;
    }

    const cacheKey = getPartialsCacheKey(partials);
    const contextCache = periodicWaveCache.get(context) ?? new Map();
    const cachedWave = contextCache.get(cacheKey);

    if (cachedWave) {
      return cachedWave;
    }

    const highestPartial = partials.at(-1)?.multiple;

    if (!highestPartial) {
      return undefined;
    }

    const real = new Float32Array(highestPartial + 1);
    const imag = new Float32Array(highestPartial + 1);
    const partialGainScale = getPartialGainScale(partials);

    partials.forEach((partial) => {
      imag[partial.multiple] = partial.gain * partialGainScale;
    });

    const wave = context.createPeriodicWave(real, imag, {
      disableNormalization: true,
    });

    contextCache.set(cacheKey, wave);
    periodicWaveCache.set(context, contextCache);

    return wave;
  }

  return { getPeriodicWave };
}
