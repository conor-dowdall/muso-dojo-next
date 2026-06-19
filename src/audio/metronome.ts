import {
  getRegionEndSeconds,
  type LoadedSamplePack,
} from "./samplePackLibrary";
import { type SamplePackId } from "./types";

export const METRONOME_SAMPLE_PACK_ID = "metronome" satisfies SamplePackId;

const METRONOME_REGULAR_REGION_ID = "metronome-regular";
const METRONOME_ACCENT_REGION_ID = "metronome-accent";
const CLICK_FADE_OUT_SECONDS = 0.012;
const REGULAR_CLICK_GAIN = 0.82;
const ACCENT_CLICK_GAIN = 0.9;
const MIN_GAIN_VALUE = 0.0001;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getLinearRampValue({
  endTime,
  endValue,
  startTime,
  startValue,
  time,
}: {
  endTime: number;
  endValue: number;
  startTime: number;
  startValue: number;
  time: number;
}) {
  if (endTime <= startTime) {
    return endValue;
  }

  const progress = clamp((time - startTime) / (endTime - startTime), 0, 1);

  return startValue + (endValue - startValue) * progress;
}

function holdGainAtTime(gain: AudioParam, time: number, fallbackValue: number) {
  if (typeof gain.cancelAndHoldAtTime === "function") {
    gain.cancelAndHoldAtTime(time);
    return;
  }

  gain.cancelScheduledValues(time);
  gain.setValueAtTime(Math.max(MIN_GAIN_VALUE, fallbackValue), time);
}

function getMetronomeRegion({
  accent,
  loaded,
}: {
  accent: boolean;
  loaded: LoadedSamplePack;
}) {
  const regionId = accent
    ? METRONOME_ACCENT_REGION_ID
    : METRONOME_REGULAR_REGION_ID;

  return loaded.pack.regions.find((region) => region.id === regionId);
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
  const region = getMetronomeRegion({ accent, loaded });

  if (!region) {
    return undefined;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const stopTime = startTime + region.durationSeconds;
  const fadeOutTime = Math.max(startTime, stopTime - CLICK_FADE_OUT_SECONDS);
  const clickGain = accent ? ACCENT_CLICK_GAIN : REGULAR_CLICK_GAIN;
  let disconnected = false;
  let cancellationRequested = false;

  source.buffer = loaded.buffer;
  gain.gain.setValueAtTime(clickGain, startTime);
  gain.gain.setValueAtTime(clickGain, fadeOutTime);
  gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, stopTime);
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
        const cancelGain =
          cancelTime < fadeOutTime
            ? clickGain
            : getLinearRampValue({
                endTime: stopTime,
                endValue: MIN_GAIN_VALUE,
                startTime: fadeOutTime,
                startValue: clickGain,
                time: cancelTime,
              });
        const cancelStopTime = cancelTime + CLICK_FADE_OUT_SECONDS;

        holdGainAtTime(gain.gain, cancelTime, cancelGain);
        gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, cancelStopTime);
        source.stop(cancelStopTime + 0.001);
      } catch {
        // The click may already have stopped.
      }
    },
  };
}
