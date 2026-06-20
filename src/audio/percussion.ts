import {
  getPercussionRegionId,
  type PercussionSampleId,
} from "@/data/rhythmPresets";
import {
  getRegionEndSeconds,
  type LoadedSamplePack,
} from "./samplePackLibrary";
import { type SamplePackId } from "./types";

export const PERCUSSION_SAMPLE_PACK_ID = "percussion" satisfies SamplePackId;

const HIT_CANCEL_FADE_OUT_SECONDS = 0.004;
const PERCUSSION_TRIM_GAIN = 0.82;
const MIN_GAIN_VALUE = 0.0001;

function holdGainAtTime(gain: AudioParam, time: number, fallbackValue: number) {
  if (typeof gain.cancelAndHoldAtTime === "function") {
    gain.cancelAndHoldAtTime(time);
    return;
  }

  gain.cancelScheduledValues(time);
  gain.setValueAtTime(Math.max(MIN_GAIN_VALUE, fallbackValue), time);
}

function getPercussionRegion(
  loaded: LoadedSamplePack,
  sampleId: PercussionSampleId,
) {
  const regionId = getPercussionRegionId(sampleId);

  return loaded.pack.regions.find((region) => region.id === regionId);
}

export interface ScheduledPercussionHit {
  disconnect: () => void;
  startTime: number;
  stop: () => void;
}

export function schedulePercussionHit({
  context,
  destination,
  loaded,
  onEnded,
  sampleId,
  startTime,
  velocity = 0.72,
}: {
  context: AudioContext;
  destination: AudioNode;
  loaded: LoadedSamplePack;
  onEnded?: () => void;
  sampleId: PercussionSampleId;
  startTime: number;
  velocity?: number;
}): ScheduledPercussionHit | undefined {
  const region = getPercussionRegion(loaded, sampleId);

  if (!region) {
    return undefined;
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const stopTime = startTime + region.durationSeconds;
  const hitGain = Math.max(
    MIN_GAIN_VALUE,
    Math.min(1.4, velocity) * PERCUSSION_TRIM_GAIN,
  );
  let disconnected = false;
  let cancellationRequested = false;

  source.buffer = loaded.buffer;
  gain.gain.setValueAtTime(hitGain, startTime);
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
          cancelTime + HIT_CANCEL_FADE_OUT_SECONDS,
        );

        holdGainAtTime(gain.gain, cancelTime, hitGain);
        gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, cancelStopTime);
        source.stop(cancelStopTime + 0.001);
      } catch {
        // The hit may already have stopped.
      }
    },
  };
}
