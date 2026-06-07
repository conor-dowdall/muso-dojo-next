const CLICK_DURATION_SECONDS = 0.035;
const CLICK_SAMPLE_RATE_FALLBACK = 48_000;

const clickBufferCache = new WeakMap<AudioContext, AudioBuffer>();

function createClickBuffer(context: AudioContext) {
  const sampleRate = context.sampleRate || CLICK_SAMPLE_RATE_FALLBACK;
  const length = Math.max(1, Math.ceil(sampleRate * CLICK_DURATION_SECONDS));
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    const progress = index / channel.length;
    const envelope = (1 - progress) ** 4;
    const noise = Math.random() * 2 - 1;
    channel[index] = noise * envelope;
  }

  return buffer;
}

function getClickBuffer(context: AudioContext) {
  const cached = clickBufferCache.get(context);

  if (cached) {
    return cached;
  }

  const buffer = createClickBuffer(context);
  clickBufferCache.set(context, buffer);
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
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const stopTime = startTime + CLICK_DURATION_SECONDS;
  let disconnected = false;

  source.buffer = getClickBuffer(context);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(accent ? 1_900 : 1_350, startTime);
  filter.Q.setValueAtTime(0.8, startTime);
  gain.gain.setValueAtTime(accent ? 0.22 : 0.14, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(startTime);
  source.stop(stopTime);

  const disconnect = () => {
    if (disconnected) {
      return;
    }

    disconnected = true;
    source.disconnect();
    filter.disconnect();
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
