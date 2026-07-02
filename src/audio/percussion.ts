import {
  getPercussionRegionId,
  type PercussionSampleId,
} from "@/data/rhythmPresets";
import {
  getRegionEndSeconds,
  type LoadedSamplePack,
} from "./samplePackLibrary";
import { PERCUSSION_STOP_RELEASE_SECONDS } from "./audioStopConfig";
import { type SamplePackId } from "./types";

export const PERCUSSION_SAMPLE_PACK_ID = "percussion" satisfies SamplePackId;

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
  stop: (atTime?: number) => void;
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
  let cancelStartTime: number | undefined;

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
    stop: (atTime) => {
      try {
        const requestedCancelTime = atTime ?? context.currentTime;

        if (requestedCancelTime <= startTime) {
          if (cancelStartTime !== undefined && startTime >= cancelStartTime) {
            return;
          }

          cancelStartTime = startTime;
          source.stop(startTime);
          return;
        }

        const cancelTime = Math.min(
          Math.max(context.currentTime, requestedCancelTime),
          stopTime,
        );
        const nextCancelStopTime = Math.min(
          stopTime,
          cancelTime + PERCUSSION_STOP_RELEASE_SECONDS,
        );

        if (cancelStartTime !== undefined && cancelTime >= cancelStartTime) {
          return;
        }

        cancelStartTime = cancelTime;
        holdGainAtTime(gain.gain, cancelTime, hitGain);
        gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, nextCancelStopTime);
        source.stop(nextCancelStopTime + 0.001);
      } catch {
        // The hit may already have stopped.
      }
    },
  };
}
