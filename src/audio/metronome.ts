const CLICK_DURATION_SECONDS = 0.08;
const CLICK_SAMPLE_RATE_FALLBACK = 48_000;
const CLICK_FADE_OUT_SECONDS = 0.012;
const CLICK_PEAK_SAMPLE = 0.9;
const IMPACT_FILTER_FREQUENCY_HZ = 2_400;
const REGULAR_CLICK_FREQUENCY_HZ = 680;
const ACCENT_CLICK_FREQUENCY_HZ = 880;
const REGULAR_CLICK_GAIN = 0.42;
const ACCENT_CLICK_GAIN = 0.58;

const regularClickBufferCache = new WeakMap<AudioContext, AudioBuffer>();
const accentClickBufferCache = new WeakMap<AudioContext, AudioBuffer>();

function createClickBuffer({
  context,
  frequencyHz,
  noiseSeed,
}: {
  context: AudioContext;
  frequencyHz: number;
  noiseSeed: number;
}) {
  const sampleRate = context.sampleRate || CLICK_SAMPLE_RATE_FALLBACK;
  const length = Math.max(1, Math.ceil(sampleRate * CLICK_DURATION_SECONDS));
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);
  const impactFilterCoefficient =
    1 - Math.exp((-2 * Math.PI * IMPACT_FILTER_FREQUENCY_HZ) / sampleRate);
  let filteredNoise = 0;
  let peak = 0;
  let noiseState = noiseSeed;

  for (let index = 0; index < channel.length; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(1, time / 0.0007);

    noiseState = (Math.imul(noiseState, 1_664_525) + 1_013_904_223) >>> 0;
    const noise = noiseState / 0x80000000 - 1;
    filteredNoise += impactFilterCoefficient * (noise - filteredNoise);

    // Unevenly spaced resonances give the hit the body of a small wooden block.
    const body =
      Math.sin(2 * Math.PI * frequencyHz * time) * Math.exp(-time * 30) +
      0.46 *
        Math.sin(2 * Math.PI * frequencyHz * 1.51 * time + Math.PI / 5) *
        Math.exp(-time * 43) +
      0.2 *
        Math.sin(2 * Math.PI * frequencyHz * 2.13 * time + Math.PI / 3) *
        Math.exp(-time * 66);
    const impact =
      filteredNoise * Math.exp(-time * 105) +
      noise * Math.exp(-time * 420) * 0.12;
    const sample = attack * (body * 0.82 + impact * 0.18);

    channel[index] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }

  if (peak > 0) {
    const normalizationGain = CLICK_PEAK_SAMPLE / peak;

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] *= normalizationGain;
    }
  }

  return buffer;
}

function getClickBuffer(context: AudioContext, accent: boolean) {
  const cache = accent ? accentClickBufferCache : regularClickBufferCache;
  const cached = cache.get(context);

  if (cached) {
    return cached;
  }

  const buffer = createClickBuffer({
    context,
    frequencyHz: accent
      ? ACCENT_CLICK_FREQUENCY_HZ
      : REGULAR_CLICK_FREQUENCY_HZ,
    noiseSeed: accent ? 0x2f6e2b1 : 0x17a53d9,
  });
  cache.set(context, buffer);
  return buffer;
}

export interface ScheduledMetronomeClick {
  disconnect: () => void;
  startTime: number;
  stop: () => void;
}

export function scheduleMetronomeClick({
  accent,
  context,
  destination,
  onEnded,
  startTime,
}: {
  accent: boolean;
  context: AudioContext;
  destination: AudioNode;
  onEnded?: () => void;
  startTime: number;
}): ScheduledMetronomeClick {
  const source = context.createBufferSource();
  const gain = context.createGain();
  const stopTime = startTime + CLICK_DURATION_SECONDS;
  const fadeOutTime = stopTime - CLICK_FADE_OUT_SECONDS;
  const clickGain = accent ? ACCENT_CLICK_GAIN : REGULAR_CLICK_GAIN;
  let disconnected = false;

  source.buffer = getClickBuffer(context, accent);
  gain.gain.setValueAtTime(clickGain, startTime);
  gain.gain.setValueAtTime(clickGain, fadeOutTime);
  gain.gain.linearRampToValueAtTime(0, stopTime);
  source.connect(gain);
  gain.connect(destination);
  source.start(startTime);
  source.stop(stopTime);

  const disconnect = () => {
    if (disconnected) {
      return;
    }

    disconnected = true;
    source.disconnect();
    gain.disconnect();
    onEnded?.();
  };

  source.addEventListener("ended", disconnect, { once: true });

  return {
    disconnect,
    startTime,
    stop: () => {
      try {
        source.stop(Math.max(context.currentTime, startTime));
      } catch {
        // The click may already have stopped.
      }
    },
  };
}
