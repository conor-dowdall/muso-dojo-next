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

export interface LookaheadSchedulerDiagnostics {
  lateEventCount: number;
  maxLateEventSeconds: number;
  maxTickIntervalSeconds: number;
  revision: number;
  schedulerStartCount: number;
}

const emptyDiagnostics: LookaheadSchedulerDiagnostics = {
  lateEventCount: 0,
  maxLateEventSeconds: 0,
  maxTickIntervalSeconds: 0,
  revision: 0,
  schedulerStartCount: 0,
};

let diagnostics = emptyDiagnostics;

interface SharedTimerEntry {
  callback: () => void;
  dueTime: number;
}

const sharedTimerEntries = new Map<object, SharedTimerEntry>();
let sharedNativeTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

function armSharedTimer() {
  if (sharedNativeTimer !== undefined) {
    globalThis.clearTimeout(sharedNativeTimer);
  }

  const nextDueTime = Math.min(
    ...[...sharedTimerEntries.values()].map((entry) => entry.dueTime),
  );
  if (!Number.isFinite(nextDueTime)) {
    sharedNativeTimer = undefined;
    return;
  }

  sharedNativeTimer = globalThis.setTimeout(
    () => {
      sharedNativeTimer = undefined;
      const now = Date.now();
      const dueEntries = [...sharedTimerEntries].filter(
        ([, entry]) => entry.dueTime <= now + 1,
      );
      dueEntries.forEach(([token]) => sharedTimerEntries.delete(token));
      dueEntries.forEach(([, entry]) => entry.callback());
      armSharedTimer();
    },
    Math.max(1, nextDueTime - Date.now()),
  );
}

function setSharedTimer(callback: () => void, delayMilliseconds: number) {
  const token = {};
  sharedTimerEntries.set(token, {
    callback,
    dueTime: Date.now() + Math.max(1, delayMilliseconds),
  });
  armSharedTimer();
  return token;
}

function clearSharedTimer(timer: unknown) {
  if (typeof timer === "object" && timer !== null) {
    sharedTimerEntries.delete(timer);
    armSharedTimer();
  }
}

function recordDiagnostics(
  update: Partial<
    Pick<
      LookaheadSchedulerDiagnostics,
      | "lateEventCount"
      | "maxLateEventSeconds"
      | "maxTickIntervalSeconds"
      | "schedulerStartCount"
    >
  >,
) {
  diagnostics = {
    ...diagnostics,
    ...update,
    revision: diagnostics.revision + 1,
  };
}

export function getLookaheadSchedulerDiagnostics() {
  return diagnostics;
}

export function resetLookaheadSchedulerDiagnostics() {
  diagnostics = emptyDiagnostics;
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
  setTimer,
  clearTimer,
  tickMilliseconds = AUDIO_SCHEDULER_TICK_MILLISECONDS,
}: LookaheadSchedulerOptions<TPayload>): LookaheadScheduler {
  const scheduleTimer = setTimer ?? setSharedTimer;
  const cancelTimer = clearTimer ?? clearSharedTimer;
  const cycleDuration = getCycleDuration(events);
  let nextCycle = 0;
  let nextEventIndex = 0;
  let originTime = 0;
  let running = false;
  let timer: unknown;
  let previousTickTime: number | undefined;

  const clearPendingTimer = () => {
    if (timer === undefined) {
      return;
    }

    cancelTimer(timer);
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

    if (previousTickTime !== undefined) {
      const tickInterval = currentTime - previousTickTime;

      if (
        Number.isFinite(tickInterval) &&
        tickInterval > diagnostics.maxTickIntervalSeconds
      ) {
        recordDiagnostics({ maxTickIntervalSeconds: tickInterval });
      }
    }
    previousTickTime = currentTime;

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
      } else {
        recordDiagnostics({
          lateEventCount: diagnostics.lateEventCount + 1,
          maxLateEventSeconds: Math.max(
            diagnostics.maxLateEventSeconds,
            earliestSafeStartTime - eventStartTime,
          ),
        });
      }

      advanceCursor();
    }

    timer = scheduleTimer(tick, Math.max(1, tickMilliseconds));
  };

  return {
    isRunning: () => running,
    start: (startTime) => {
      clearPendingTimer();
      originTime = startTime;
      nextCycle = 0;
      nextEventIndex = 0;
      previousTickTime = undefined;
      running =
        Number.isFinite(startTime) && events.length > 0 && cycleDuration > 0;

      if (running) {
        recordDiagnostics({
          schedulerStartCount: diagnostics.schedulerStartCount + 1,
        });
        tick();
      }
    },
    stop: () => {
      running = false;
      clearPendingTimer();
    },
  };
}
