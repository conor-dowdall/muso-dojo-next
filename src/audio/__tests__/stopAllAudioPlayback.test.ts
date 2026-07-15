import { afterEach, describe, expect, it, vi } from "vitest";
import { musoAudioEngine } from "@/audio/createWebAudioEngine";
import { exercisePlaybackCoordinator } from "@/audio/exercisePlaybackCoordinator";
import { partSequenceCoordinator } from "@/audio/partSequenceCoordinator";
import { rhythmPlaybackCoordinator } from "@/audio/rhythmPlaybackCoordinator";
import {
  stopAllAudioPlayback,
  stopTransportPlayback,
} from "@/audio/stopAllAudioPlayback";

describe("audio playback stopping", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function spyOnPlaybackStops() {
    return {
      exercise: vi
        .spyOn(exercisePlaybackCoordinator, "stop")
        .mockImplementation(() => undefined),
      partSequence: vi
        .spyOn(partSequenceCoordinator, "stop")
        .mockImplementation(() => undefined),
      rhythm: vi
        .spyOn(rhythmPlaybackCoordinator, "stop")
        .mockImplementation(() => undefined),
      stopAll: vi
        .spyOn(musoAudioEngine, "stopAll")
        .mockImplementation(() => undefined),
    };
  }

  it("stops competing transports without stopping persistent audio layers", () => {
    const stops = spyOnPlaybackStops();

    stopTransportPlayback();

    expect(stops.partSequence).toHaveBeenCalledWith({ stopPlayback: false });
    expect(stops.exercise).toHaveBeenCalledOnce();
    expect(stops.rhythm).toHaveBeenCalledOnce();
    expect(stops.stopAll).not.toHaveBeenCalled();
  });

  it("retains the global stop path for every audio layer", () => {
    const stops = spyOnPlaybackStops();

    stopAllAudioPlayback();

    expect(stops.partSequence).toHaveBeenCalledWith({ stopPlayback: false });
    expect(stops.exercise).toHaveBeenCalledOnce();
    expect(stops.rhythm).toHaveBeenCalledOnce();
    expect(stops.stopAll).toHaveBeenCalledOnce();
  });
});
