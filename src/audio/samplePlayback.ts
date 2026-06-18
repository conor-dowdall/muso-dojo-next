import { isPlayableMidiNote } from "./pitch";
import {
  getConcertPitchHz,
  getLoopEndSeconds,
  getLoopStartSeconds,
  getPlaybackRate,
  getRegionEndSeconds,
  getRegionForMidi,
  getScheduledOffset,
  regionHasLoop,
  type SamplePack,
} from "./samplePackLibrary";
import { type AudioPreset, type AudioUse } from "./types";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const MIN_GAIN_VALUE = 0.0001;
const MIN_ATTACK_SECONDS = 0.003;
const MIN_RELEASE_SECONDS = 0.02;
const MAX_ONE_SHOT_RELEASE_SECONDS = 0.35;
export const DEFAULT_DRONE_RELEASE_SECONDS = 0.22;

export interface ActiveSampleVoice {
  disconnect: () => void;
  stop: (releaseSeconds?: number) => void;
}

export interface ActiveDroneVoice {
  gain: GainNode;
  getScheduledGain: (time: number) => number;
  midiNote: number;
  source: AudioBufferSourceNode;
  stop: (releaseSeconds?: number) => void;
  velocity: number;
}

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

function getVoiceGain({
  preset,
  regionGain,
  use = DEFAULT_AUDIO_USE,
  velocity,
}: {
  preset: AudioPreset;
  regionGain: number;
  use?: AudioUse;
  velocity?: number;
}) {
  const useGain = use === "drone" ? 0.78 : use === "exercise" ? 0.86 : 0.9;

  return clamp(velocity ?? 0.82, 0, 1) * preset.gain * regionGain * useGain;
}

function getAttackSeconds(preset: AudioPreset) {
  return Math.max(MIN_ATTACK_SECONDS, preset.envelope.attackSeconds);
}

function getReleaseSeconds(preset: AudioPreset, durationSeconds: number) {
  return clamp(
    preset.envelope.releaseSeconds,
    MIN_RELEASE_SECONDS,
    Math.min(MAX_ONE_SHOT_RELEASE_SECONDS, durationSeconds * 0.5),
  );
}

function startSource({
  durationSeconds,
  offsetSeconds,
  source,
  startTime,
}: {
  durationSeconds?: number;
  offsetSeconds: number;
  source: AudioBufferSourceNode;
  startTime: number;
}) {
  if (durationSeconds === undefined) {
    source.start(startTime, offsetSeconds);
    return;
  }

  source.start(startTime, offsetSeconds, durationSeconds);
}

export function createSampleVoice({
  buffer,
  concertPitchHz,
  context,
  durationSeconds,
  midiNote,
  onEnded,
  pack,
  preset,
  startTime,
  use = DEFAULT_AUDIO_USE,
  velocity,
}: {
  buffer: AudioBuffer;
  concertPitchHz?: number;
  context: AudioContext;
  durationSeconds?: number;
  midiNote: number;
  onEnded: () => void;
  pack: SamplePack;
  preset: AudioPreset;
  startTime: number;
  use?: AudioUse;
  velocity?: number;
}): ActiveSampleVoice | undefined {
  if (!isPlayableMidiNote(midiNote)) {
    return undefined;
  }

  const region = getRegionForMidi(pack, midiNote);
  const playbackRate = getPlaybackRate({
    concertPitchHz: getConcertPitchHz(concertPitchHz),
    midiNote,
    region,
  });
  const requestedDurationSeconds =
    durationSeconds ?? preset.defaultDurationSeconds;

  if (requestedDurationSeconds <= 0 || playbackRate <= 0) {
    return undefined;
  }

  const naturalDurationSeconds = region.durationSeconds / playbackRate;
  const shouldLoop =
    regionHasLoop(region) &&
    requestedDurationSeconds + preset.envelope.releaseSeconds >
      naturalDurationSeconds;
  const offsetSeconds = getScheduledOffset({
    context,
    loop: shouldLoop,
    playbackRate,
    region,
    startTime,
  });

  if (offsetSeconds === undefined) {
    return undefined;
  }

  const startAt = Math.max(context.currentTime, startTime);
  const attackSeconds = Math.min(
    getAttackSeconds(preset),
    requestedDurationSeconds * 0.25,
  );
  const releaseSeconds = getReleaseSeconds(preset, requestedDurationSeconds);
  const releaseStartTime = Math.max(
    startAt + MIN_ATTACK_SECONDS,
    startTime + requestedDurationSeconds,
  );
  const releaseEndTime = releaseStartTime + releaseSeconds;
  const source = context.createBufferSource();
  const gain = context.createGain();
  const voiceGain = getVoiceGain({
    preset,
    regionGain: region.gain,
    use,
    velocity,
  });
  let disconnected = false;
  let cancelStopRequested = false;
  const getScheduledGain = (time: number) => {
    if (time <= startAt) {
      return MIN_GAIN_VALUE;
    }

    if (time < startAt + attackSeconds) {
      return getLinearRampValue({
        endTime: startAt + attackSeconds,
        endValue: voiceGain,
        startTime: startAt,
        startValue: MIN_GAIN_VALUE,
        time,
      });
    }

    if (time < releaseStartTime) {
      return voiceGain;
    }

    return getLinearRampValue({
      endTime: releaseEndTime,
      endValue: MIN_GAIN_VALUE,
      startTime: releaseStartTime,
      startValue: voiceGain,
      time,
    });
  };

  source.buffer = buffer;
  source.playbackRate.setValueAtTime(playbackRate, startAt);

  if (shouldLoop) {
    source.loop = true;
    source.loopStart = getLoopStartSeconds(region) ?? region.offsetSeconds;
    source.loopEnd = getLoopEndSeconds(region) ?? getRegionEndSeconds(region);
  }

  gain.gain.setValueAtTime(MIN_GAIN_VALUE, startAt);
  gain.gain.linearRampToValueAtTime(
    Math.max(MIN_GAIN_VALUE, voiceGain),
    startAt + attackSeconds,
  );
  gain.gain.setValueAtTime(
    Math.max(MIN_GAIN_VALUE, voiceGain),
    releaseStartTime,
  );
  gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, releaseEndTime);

  source.connect(gain);
  gain.connect(context.destination);

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
  };

  const stop = (nextReleaseSeconds = releaseSeconds) => {
    if (cancelStopRequested) {
      return;
    }

    cancelStopRequested = true;
    const stopStartTime = Math.max(context.currentTime, startAt);
    const stopTime = stopStartTime + Math.max(0, nextReleaseSeconds);

    holdGainAtTime(gain.gain, stopStartTime, getScheduledGain(stopStartTime));
    gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, stopTime);

    try {
      source.stop(stopTime + 0.01);
    } catch {
      onEnded();
    }
  };

  source.addEventListener("ended", onEnded, { once: true });

  try {
    startSource({
      durationSeconds: shouldLoop
        ? undefined
        : getRegionEndSeconds(region) - offsetSeconds,
      offsetSeconds,
      source,
      startTime: startAt,
    });

    if (shouldLoop || releaseEndTime < startAt + naturalDurationSeconds) {
      source.stop(releaseEndTime + 0.01);
    }
  } catch {
    disconnect();
    return undefined;
  }

  return {
    disconnect,
    stop,
  } satisfies ActiveSampleVoice;
}

export function stopDroneVoice(
  droneVoice: ActiveDroneVoice,
  audioContext: AudioContext,
  releaseSeconds = DEFAULT_DRONE_RELEASE_SECONDS,
) {
  const stopStartTime = audioContext.currentTime;
  const stopTime = stopStartTime + Math.max(0, releaseSeconds);

  holdGainAtTime(
    droneVoice.gain.gain,
    stopStartTime,
    droneVoice.getScheduledGain(stopStartTime),
  );
  droneVoice.gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, stopTime);

  try {
    droneVoice.source.stop(stopTime + 0.01);
  } catch {
    try {
      droneVoice.source.disconnect();
      droneVoice.gain.disconnect();
    } catch {
      // The drone voice may already have stopped.
    }
  }
}

export function createDroneVoice({
  buffer,
  concertPitchHz,
  context,
  midiNote,
  pack,
  preset,
  velocity,
}: {
  buffer: AudioBuffer;
  concertPitchHz: number;
  context: AudioContext;
  midiNote: number;
  pack: SamplePack;
  preset: AudioPreset;
  velocity?: number;
}) {
  if (!isPlayableMidiNote(midiNote)) {
    return undefined;
  }

  const region = getRegionForMidi(pack, midiNote);

  if (!regionHasLoop(region)) {
    return undefined;
  }

  const startTime = context.currentTime;
  const playbackRate = getPlaybackRate({
    concertPitchHz,
    midiNote,
    region,
  });
  const source = context.createBufferSource();
  const gain = context.createGain();
  const voiceGain = getVoiceGain({
    preset,
    regionGain: region.gain,
    use: "drone",
    velocity,
  });
  const attackSeconds = Math.max(0.04, getAttackSeconds(preset));
  const startGain = MIN_GAIN_VALUE;
  const targetGain = Math.max(MIN_GAIN_VALUE, voiceGain);

  source.buffer = buffer;
  source.loop = true;
  source.loopStart = getLoopStartSeconds(region) ?? region.offsetSeconds;
  source.loopEnd = getLoopEndSeconds(region) ?? getRegionEndSeconds(region);
  source.playbackRate.setValueAtTime(playbackRate, startTime);
  gain.gain.setValueAtTime(startGain, startTime);
  gain.gain.linearRampToValueAtTime(targetGain, startTime + attackSeconds);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(startTime, region.offsetSeconds);
  source.addEventListener(
    "ended",
    () => {
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
    },
    { once: true },
  );

  const droneVoice = {
    gain,
    midiNote,
    source,
    getScheduledGain: (time: number) => {
      if (time < startTime + attackSeconds) {
        return getLinearRampValue({
          endTime: startTime + attackSeconds,
          endValue: targetGain,
          startTime,
          startValue: startGain,
          time,
        });
      }

      return targetGain;
    },
    stop: (releaseSeconds?: number) =>
      stopDroneVoice(droneVoice, context, releaseSeconds),
    velocity: velocity ?? 1,
  } satisfies ActiveDroneVoice;

  return droneVoice;
}
