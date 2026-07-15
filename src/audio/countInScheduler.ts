import { type AudioEngine, type PlaybackGroupHandle } from "./types";

export type CountInSchedulerAudioEngine = Pick<
  AudioEngine,
  "scheduleMetronomeClick"
>;

export interface CountInSchedule {
  durationSeconds: number;
  group: PlaybackGroupHandle;
  minimumStartTime?: number;
  pulses: number;
  startTime: number;
}

export function scheduleCountInClicks(
  audioEngine: CountInSchedulerAudioEngine,
  {
    durationSeconds,
    group,
    minimumStartTime,
    pulses,
    startTime,
  }: CountInSchedule,
) {
  const pulseCount = Math.floor(pulses);

  if (
    !Number.isFinite(pulses) ||
    pulseCount <= 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    !Number.isFinite(startTime)
  ) {
    return 0;
  }

  const pulseIntervalSeconds = durationSeconds / pulseCount;
  let scheduledCount = 0;

  for (let pulse = 0; pulse < pulseCount; pulse += 1) {
    const clickStartTime = startTime + pulse * pulseIntervalSeconds;

    if (minimumStartTime !== undefined && clickStartTime < minimumStartTime) {
      continue;
    }

    if (
      audioEngine.scheduleMetronomeClick({
        accent: pulse === 0,
        group,
        startTime: clickStartTime,
      })
    ) {
      scheduledCount += 1;
    }
  }

  return scheduledCount;
}
