import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLookaheadScheduler,
  getLookaheadSchedulerDiagnostics,
  resetLookaheadSchedulerDiagnostics,
} from "@/audio/lookaheadScheduler";

describe("createLookaheadScheduler", () => {
  afterEach(() => resetLookaheadSchedulerDiagnostics());

  it("schedules repeated events inside the lookahead horizon", () => {
    let currentTime = 10;
    const callbacks: Array<() => void> = [];
    const scheduled: number[] = [];
    const scheduler = createLookaheadScheduler({
      events: [
        { duration: 0.25, offset: 0, payload: "a" },
        { duration: 0.25, offset: 0.25, payload: "b" },
      ],
      getCurrentTime: () => currentTime,
      horizonSeconds: 0.3,
      onSchedule: (_event, startTime) => scheduled.push(startTime),
      setTimer: (callback) => {
        callbacks.push(callback);
        return callback;
      },
      clearTimer: vi.fn(),
    });

    scheduler.start(10.1);
    expect(scheduled).toEqual([10.1]);

    currentTime = 10.4;
    callbacks.shift()?.();
    expect(scheduled).toEqual([10.1, 10.6]);
  });

  it("keeps an extended default runway for delayed main-thread ticks", () => {
    const scheduled: number[] = [];
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 0.25, offset: 0, payload: true }],
      getCurrentTime: () => 10,
      onSchedule: (_event, startTime) => scheduled.push(startTime),
      setTimer: () => 1,
      clearTimer: vi.fn(),
    });

    scheduler.start(10.45);

    expect(scheduled).toEqual([10.45, 10.7, 10.95, 11.2]);
  });

  it("skips missed events instead of scheduling a catch-up burst", () => {
    const scheduled: number[] = [];
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 0.25, offset: 0, payload: true }],
      getCurrentTime: () => 2,
      horizonSeconds: 0.2,
      onSchedule: (_event, startTime) => scheduled.push(startTime),
      setTimer: () => 1,
      clearTimer: vi.fn(),
    });

    scheduler.start(1);
    expect(scheduled).toEqual([]);
  });

  it("resumes on the next safely-ahead event after a delayed tick", () => {
    const scheduled: number[] = [];
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 0.25, offset: 0, payload: true }],
      getCurrentTime: () => 2,
      horizonSeconds: 0.3,
      onSchedule: (_event, startTime) => scheduled.push(startTime),
      setTimer: () => 1,
      clearTimer: vi.fn(),
    });

    scheduler.start(1);

    expect(scheduled).toEqual([2.25]);
  });

  it("records delayed ticks and events that lost their safe runway", () => {
    let currentTime = 1;
    const callbacks: Array<() => void> = [];
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 0.25, offset: 0, payload: true }],
      getCurrentTime: () => currentTime,
      horizonSeconds: 0.2,
      minimumLeadSeconds: 0.04,
      onSchedule: vi.fn(),
      setTimer: (callback) => {
        callbacks.push(callback);
        return callback;
      },
      clearTimer: vi.fn(),
    });

    scheduler.start(1.1);
    currentTime = 1.4;
    callbacks.shift()?.();

    const diagnostics = getLookaheadSchedulerDiagnostics();

    expect(diagnostics).toMatchObject({
      lateEventCount: 1,
      schedulerStartCount: 1,
    });
    expect(diagnostics.maxLateEventSeconds).toBeCloseTo(0.09);
    expect(diagnostics.maxTickIntervalSeconds).toBeCloseTo(0.4);
  });

  it("does not start for empty, zero-duration, or invalid cycles", () => {
    const setTimer = vi.fn(() => 1);
    const onSchedule = vi.fn();
    const createScheduler = (
      events: Parameters<typeof createLookaheadScheduler<boolean>>[0]["events"],
    ) =>
      createLookaheadScheduler({
        events,
        getCurrentTime: () => 1,
        onSchedule,
        setTimer,
        clearTimer: vi.fn(),
      });

    const schedulers = [
      createScheduler([]),
      createScheduler([{ duration: 0, offset: 0, payload: true }]),
      createScheduler([{ duration: Number.NaN, offset: 0, payload: true }]),
      createScheduler([
        { duration: Number.POSITIVE_INFINITY, offset: 0, payload: true },
      ]),
    ];

    schedulers.forEach((scheduler) => scheduler.start(1.1));

    expect(schedulers.every((scheduler) => !scheduler.isRunning())).toBe(true);
    expect(onSchedule).not.toHaveBeenCalled();
    expect(setTimer).not.toHaveBeenCalled();
  });

  it("stops cleanly when the audio clock is unavailable", () => {
    const setTimer = vi.fn(() => 1);
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 0.25, offset: 0, payload: true }],
      getCurrentTime: () => undefined,
      onSchedule: vi.fn(),
      setTimer,
      clearTimer: vi.fn(),
    });

    scheduler.start(1);

    expect(scheduler.isRunning()).toBe(false);
    expect(setTimer).not.toHaveBeenCalled();
  });

  it("stops without scheduling when the audio clock is non-finite", () => {
    let stopScheduler: () => void = () => undefined;
    const onSchedule = vi.fn(() => stopScheduler());
    const setTimer = vi.fn(() => 1);
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 0.25, offset: 0, payload: true }],
      getCurrentTime: () => Number.POSITIVE_INFINITY,
      onSchedule,
      setTimer,
      clearTimer: vi.fn(),
    });
    stopScheduler = scheduler.stop;

    scheduler.start(1);

    expect(scheduler.isRunning()).toBe(false);
    expect(onSchedule).not.toHaveBeenCalled();
    expect(setTimer).not.toHaveBeenCalled();
  });

  it("includes events exactly on the safe-lead and horizon boundaries", () => {
    const scheduled: number[] = [];
    const scheduler = createLookaheadScheduler({
      events: [
        { duration: 0.25, offset: 0, payload: "safe-lead" },
        { duration: 0.25, offset: 0.26, payload: "horizon" },
      ],
      getCurrentTime: () => 10,
      horizonSeconds: 0.3,
      minimumLeadSeconds: 0.04,
      onSchedule: (_event, startTime) => scheduled.push(startTime),
      setTimer: () => 1,
      clearTimer: vi.fn(),
    });

    scheduler.start(10.04);

    expect(scheduled).toHaveLength(2);
    expect(scheduled[0]).toBeCloseTo(10.04);
    expect(scheduled[1]).toBeCloseTo(10.3);
  });

  it("clears its previous timer and restarts from the new origin", () => {
    let currentTime = 1;
    const clearTimer = vi.fn();
    const scheduled: number[] = [];
    const scheduler = createLookaheadScheduler({
      events: [{ duration: 1, offset: 0, payload: true }],
      getCurrentTime: () => currentTime,
      horizonSeconds: 0.2,
      onSchedule: (_event, startTime) => scheduled.push(startTime),
      setTimer: (_callback) => Symbol("timer"),
      clearTimer,
    });

    scheduler.start(1.1);
    currentTime = 2;
    scheduler.start(2.1);
    scheduler.stop();
    scheduler.stop();

    expect(scheduled).toEqual([1.1, 2.1]);
    expect(clearTimer).toHaveBeenCalledTimes(2);
    expect(scheduler.isRunning()).toBe(false);
  });

  it("keeps schedulers isolated when they share the native timer", async () => {
    vi.useFakeTimers();
    const firstSchedule = vi.fn();
    const secondSchedule = vi.fn();
    let currentTime = 1;
    const createScheduler = (onSchedule: () => void) =>
      createLookaheadScheduler({
        events: [{ duration: 0.25, offset: 0, payload: true }],
        getCurrentTime: () => currentTime,
        horizonSeconds: 0.1,
        onSchedule,
        tickMilliseconds: 25,
      });
    const first = createScheduler(firstSchedule);
    const second = createScheduler(secondSchedule);

    first.start(1.05);
    second.start(1.05);
    first.stop();
    currentTime = 1.24;
    await vi.advanceTimersByTimeAsync(25);

    expect(firstSchedule).toHaveBeenCalledTimes(1);
    expect(secondSchedule).toHaveBeenCalledTimes(2);
    expect(second.isRunning()).toBe(true);

    second.stop();
  });
});
