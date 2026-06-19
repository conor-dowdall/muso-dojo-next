import {
  getRegionEndSeconds,
  type LoadedSamplePack,
} from "./samplePackLibrary";
import { type SamplePackId } from "./types";

export const METRONOME_SAMPLE_PACK_ID = "metronome" satisfies SamplePackId;

const METRONOME_REGION_ID = "metronome-click";
const CLICK_CANCEL_FADE_OUT_SECONDS = 0.004;
const REGULAR_CLICK_GAIN = 0.7;
const ACCENT_CLICK_GAIN = 1.2;
const MIN_GAIN_VALUE = 0.0001;

function holdGainAtTime(gain: AudioParam, time: number, fallbackValue: number) {
  if (typeof gain.cancelAndHoldAtTime === "function") {
    gain.cancelAndHoldAtTime(time);
    return;
  }

  gain.cancelScheduledValues(time);
  gain.setValueAtTime(Math.max(MIN_GAIN_VALUE, fallbackValue), time);
}

function getMetronomeRegion(loaded: LoadedSamplePack) {
  return loaded.pack.regions.find(
    (region) => region.id === METRONOME_REGION_ID,
  );
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
  loaded,
  onEnded,
  startTime,
}: {
  accent: boolean;
  context: AudioContext;
  destination: AudioNode;
  loaded: LoadedSamplePack;
  onEnded?: () => void;
  startTime: number;
}): ScheduledMetronomeClick | undefined {
  const region = getMetronomeRegion(loaded);

  if (!region) {
    return undefined;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const stopTime = startTime + region.durationSeconds;
  const clickGain = accent ? ACCENT_CLICK_GAIN : REGULAR_CLICK_GAIN;
  let disconnected = false;
  let cancellationRequested = false;

  source.buffer = loaded.buffer;
  gain.gain.setValueAtTime(clickGain, startTime);
  source.connect(gain);
  gain.connect(destination);

  const disconnect = () => {
    if (disconnected) {
      return;
    }

    disconnected = true;
    try {
      source.disconnect();
    } catch {
      // The browser may have already disconnected the source.
    }
    try {
      gain.disconnect();
    } catch {
      // The browser may have already disconnected the gain.
    }
    onEnded?.();
  };

  source.addEventListener("ended", disconnect, { once: true });

  try {
    source.start(
      startTime,
      region.offsetSeconds,
      getRegionEndSeconds(region) - region.offsetSeconds,
    );
  } catch {
    disconnect();
    return undefined;
  }

  return {
    disconnect,
    startTime,
    stop: () => {
      if (cancellationRequested) {
        return;
      }

      cancellationRequested = true;
      try {
        if (context.currentTime < startTime) {
          source.stop(startTime);
          return;
        }

        const cancelTime = Math.min(context.currentTime, stopTime);
        const cancelStopTime = Math.min(
          stopTime,
          cancelTime + CLICK_CANCEL_FADE_OUT_SECONDS,
        );

        holdGainAtTime(gain.gain, cancelTime, clickGain);
        gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, cancelStopTime);
        source.stop(cancelStopTime + 0.001);
      } catch {
        // The click may already have stopped.
      }
    },
  };
}
