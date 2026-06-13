import {
  AUDIO_SCHEDULER_HORIZON_SECONDS,
  AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS,
  AUDIO_SCHEDULER_TICK_MILLISECONDS,
} from "./audioTimingConfig";

export interface LookaheadSchedulerEvent<TPayload> {
  duration: number;
  offset: number;
  payload: TPayload;
}

export interface LookaheadSchedulerOptions<TPayload> {
  events: readonly LookaheadSchedulerEvent<TPayload>[];
  getCurrentTime: () => number | undefined;
  horizonSeconds?: number;
  minimumLeadSeconds?: number;
  onSchedule: (
    event: LookaheadSchedulerEvent<TPayload>,
    startTime: number,
    cycle: number,
    eventIndex: number,
  ) => void;
  setTimer?: (callback: () => void, delayMilliseconds: number) => unknown;
  clearTimer?: (timer: unknown) => void;
  tickMilliseconds?: number;
}

export interface LookaheadScheduler {
  isRunning: () => boolean;
  start: (startTime: number) => void;
  stop: () => void;
}

function getCycleDuration<TPayload>(
  events: readonly LookaheadSchedulerEvent<TPayload>[],
) {
  return events.reduce(
    (duration, event) => Math.max(duration, event.offset + event.duration),
    0,
  );
}

export function createLookaheadScheduler<TPayload>({
  events,
  getCurrentTime,
  horizonSeconds = AUDIO_SCHEDULER_HORIZON_SECONDS,
  minimumLeadSeconds = AUDIO_SCHEDULER_MINIMUM_LEAD_SECONDS,
  onSchedule,
  setTimer = (callback, delay) => window.setTimeout(callback, delay),
  clearTimer = (timer) => window.clearTimeout(timer as number),
  tickMilliseconds = AUDIO_SCHEDULER_TICK_MILLISECONDS,
}: LookaheadSchedulerOptions<TPayload>): LookaheadScheduler {
  const cycleDuration = getCycleDuration(events);
  let nextCycle = 0;
  let nextEventIndex = 0;
  let originTime = 0;
  let running = false;
  let timer: unknown;

  const clearPendingTimer = () => {
    if (timer === undefined) {
      return;
    }

    clearTimer(timer);
    timer = undefined;
  };

  const advanceCursor = () => {
    nextEventIndex += 1;

    if (nextEventIndex >= events.length) {
      nextEventIndex = 0;
      nextCycle += 1;
    }
  };

  const tick = () => {
    timer = undefined;

    if (!running) {
      return;
    }

    const currentTime = getCurrentTime();

    if (currentTime === undefined) {
      running = false;
      return;
    }

    const horizon = currentTime + Math.max(0, horizonSeconds);
    const earliestSafeStartTime = currentTime + Math.max(0, minimumLeadSeconds);
    const currentCycle = Math.max(
      0,
      Math.floor((currentTime - originTime) / cycleDuration),
    );

    if (currentCycle > nextCycle + 1) {
      nextCycle = currentCycle;
      nextEventIndex = 0;
    }

    while (running) {
      const event = events[nextEventIndex];

      if (!event) {
        running = false;
        return;
      }

      const eventStartTime =
        originTime + nextCycle * cycleDuration + event.offset;

      if (eventStartTime > horizon) {
        break;
      }

      if (eventStartTime >= earliestSafeStartTime) {
        onSchedule(event, eventStartTime, nextCycle, nextEventIndex);
      }

      advanceCursor();
    }

    timer = setTimer(tick, Math.max(1, tickMilliseconds));
  };

  return {
    isRunning: () => running,
    start: (startTime) => {
      clearPendingTimer();
      originTime = startTime;
      nextCycle = 0;
      nextEventIndex = 0;
      running =
        Number.isFinite(startTime) && events.length > 0 && cycleDuration > 0;

      if (running) {
        tick();
      }
    },
    stop: () => {
      running = false;
      clearPendingTimer();
    },
  };
}
