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
});
