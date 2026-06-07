import { describe, expect, it, vi } from "vitest";
import { createLookaheadScheduler } from "@/audio/lookaheadScheduler";

describe("createLookaheadScheduler", () => {
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
    expect(scheduled).toEqual([2]);
  });
});
