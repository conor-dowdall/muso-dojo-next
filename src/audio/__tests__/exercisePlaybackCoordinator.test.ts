import { describe, expect, it, vi } from "vitest";
import {
  ExercisePlaybackCoordinator,
  type ExercisePlaybackAudioEngine,
  type ExercisePlaybackRequest,
  type ExerciseSchedulerFactory,
} from "@/audio/exercisePlaybackCoordinator";
import { type PlaybackGroupHandle } from "@/audio/types";

function createRequest(id: string, midi: number): ExercisePlaybackRequest {
  return {
    events: [
      {
        durationBeats: 1,
        midi,
        offsetBeats: 0,
        stepIndex: 0,
      },
    ],
    id,
    presetId: "reference-tone",
    tempoBpm: 60,
  };
}

describe("ExercisePlaybackCoordinator", () => {
  it("restarts changed playback from a fresh origin instead of the old beat grid", async () => {
    let currentTime = 10;
    let nextGroupId = 0;
    const cancelPlaybackGroup = vi.fn();
    const audioEngine: ExercisePlaybackAudioEngine = {
      cancelPlaybackGroup,
      createPlaybackGroup: () =>
        `group-${nextGroupId++}` as PlaybackGroupHandle,
      getCurrentTime: () => currentTime,
      prime: async () => true,
      scheduleNote: vi.fn(),
      subscribeToReset: () => () => undefined,
      subscribeToStopAll: () => () => undefined,
    };
    const schedulers: Array<{
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }> = [];
    const createScheduler: ExerciseSchedulerFactory = () => {
      const scheduler = {
        isRunning: () => true,
        start: vi.fn(),
        stop: vi.fn(),
      };
      schedulers.push(scheduler);
      return scheduler;
    };
    const coordinator = new ExercisePlaybackCoordinator(
      audioEngine,
      createScheduler,
    );

    await coordinator.start(createRequest("looper", 60));

    expect(schedulers[0]?.start).toHaveBeenCalledWith(10.08);

    currentTime = 10.2;
    await coordinator.start(createRequest("looper", 62));

    expect(schedulers[0]?.stop).toHaveBeenCalledOnce();
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");
    expect(schedulers[1]?.start).toHaveBeenCalledWith(10.28);
    expect(coordinator.getSnapshot()).toMatchObject({
      activeId: "looper",
      originTime: 10.28,
      playing: true,
    });
  });
});
