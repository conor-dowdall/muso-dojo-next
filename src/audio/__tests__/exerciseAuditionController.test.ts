import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExerciseAuditionController,
  type ExerciseAuditionAudioEngine,
} from "@/audio/exerciseAuditionController";
import { type AudioVoiceHandle, type PlaybackGroupHandle } from "@/audio/types";

function voiceHandle(midi: number) {
  return `voice-${midi}` as AudioVoiceHandle;
}

function groupHandle(index: number) {
  return `group-${index}` as PlaybackGroupHandle;
}

function createAudioEngine() {
  let nextGroupIndex = 0;
  const endListeners = new Map<AudioVoiceHandle, () => void>();
  const cancelPlaybackGroup = vi.fn();
  const scheduleNote = vi.fn(
    (request: Parameters<ExerciseAuditionAudioEngine["scheduleNote"]>[0]) =>
      voiceHandle(request.midiNote),
  );
  const audioEngine: ExerciseAuditionAudioEngine = {
    cancelPlaybackGroup,
    createPlaybackGroup: () => groupHandle(nextGroupIndex++),
    getCurrentTime: () => 10,
    prime: async () => true,
    scheduleNote,
    subscribeToVoiceEnd: (handle, listener) => {
      endListeners.set(handle, listener);
      return () => endListeners.delete(handle);
    },
  };

  return {
    audioEngine,
    cancelPlaybackGroup,
    endListeners,
    scheduleNote,
  };
}

describe("ExerciseAuditionController", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules every chord tone together and tracks visible keys", async () => {
    vi.useFakeTimers();
    const { audioEngine, cancelPlaybackGroup, endListeners, scheduleNote } =
      createAudioEngine();
    const controller = new ExerciseAuditionController(audioEngine);

    await controller.audition({
      durationSeconds: 0.55,
      notes: [
        { key: "position-0", midi: 60 },
        { key: "position-2", midi: 64 },
        { midi: 67 },
      ],
      presetId: "piano",
      velocity: 0.72,
    });

    expect(scheduleNote).toHaveBeenCalledTimes(3);
    expect(
      scheduleNote.mock.calls.map(([request]) => ({
        group: request.group,
        startTime: request.startTime,
      })),
    ).toEqual([
      { group: "group-0", startTime: 10.02 },
      { group: "group-0", startTime: 10.02 },
      { group: "group-0", startTime: 10.02 },
    ]);
    expect([...controller.getSnapshot()]).toEqual(["position-0", "position-2"]);

    endListeners.get(voiceHandle(60))?.();
    expect([...controller.getSnapshot()]).toEqual(["position-2"]);

    endListeners.get(voiceHandle(64))?.();
    endListeners.get(voiceHandle(67))?.();
    expect([...controller.getSnapshot()]).toEqual([]);
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");
  });

  it("cancels the previous audition before starting another", async () => {
    vi.useFakeTimers();
    const { audioEngine, cancelPlaybackGroup } = createAudioEngine();
    const controller = new ExerciseAuditionController(audioEngine);

    await controller.audition({
      durationSeconds: 0.55,
      notes: [{ key: "position-0", midi: 60 }],
      presetId: "piano",
      velocity: 0.72,
    });
    await controller.audition({
      durationSeconds: 0.55,
      notes: [{ key: "position-1", midi: 62 }],
      presetId: "piano",
      velocity: 0.72,
    });

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");
    expect([...controller.getSnapshot()]).toEqual(["position-1"]);

    controller.cancel();
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-1");
    expect([...controller.getSnapshot()]).toEqual([]);
  });

  it("does not schedule a pending audition after cancellation", async () => {
    let resolvePrime: (prepared: boolean) => void = () => undefined;
    const prime = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolvePrime = resolve;
        }),
    );
    const { audioEngine, scheduleNote } = createAudioEngine();
    const controller = new ExerciseAuditionController({
      ...audioEngine,
      prime,
    });
    const audition = controller.audition({
      durationSeconds: 0.55,
      notes: [{ key: "position-0", midi: 60 }],
      presetId: "piano",
      velocity: 0.72,
    });

    controller.cancel();
    resolvePrime(true);

    await expect(audition).resolves.toBe(false);
    expect(scheduleNote).not.toHaveBeenCalled();
  });
});
