import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PresetAuditionController,
  type PresetAuditionAudioEngine,
} from "@/audio/presetAuditionController";
import { type AudioVoiceHandle, type PlaybackGroupHandle } from "@/audio/types";

function voiceHandle(index: number) {
  return `voice-${index}` as AudioVoiceHandle;
}

function groupHandle(index: number) {
  return `group-${index}` as PlaybackGroupHandle;
}

function createAudioEngine() {
  let nextGroupIndex = 0;
  let nextVoiceIndex = 0;
  let stopAllListener: () => void = () => undefined;
  const endListeners = new Map<AudioVoiceHandle, () => void>();
  const cancelPlaybackGroup = vi.fn();
  const scheduleNote = vi.fn(
    (_request: Parameters<PresetAuditionAudioEngine["scheduleNote"]>[0]) =>
      voiceHandle(nextVoiceIndex++),
  );
  const audioEngine: PresetAuditionAudioEngine = {
    cancelPlaybackGroup,
    createPlaybackGroup: () => groupHandle(nextGroupIndex++),
    getCurrentTime: () => 10,
    prime: async () => true,
    scheduleNote,
    subscribeToStopAll: (listener) => {
      stopAllListener = listener;
      return () => {
        stopAllListener = () => undefined;
      };
    },
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
    stopAll: () => stopAllListener(),
  };
}

describe("PresetAuditionController", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules a preset preview on its own playback group", async () => {
    vi.useFakeTimers();
    const { audioEngine, scheduleNote } = createAudioEngine();
    const controller = new PresetAuditionController(audioEngine);

    await expect(
      controller.audition({
        midiNote: 60,
        presetId: "piano",
        use: "preview",
        velocity: 0.82,
      }),
    ).resolves.toBe(true);

    expect(scheduleNote).toHaveBeenCalledWith({
      group: "group-0",
      midiNote: 60,
      presetId: "piano",
      startTime: 10.02,
      use: "preview",
      velocity: 0.82,
    });
    controller.dispose();
  });

  it("replaces the previous preview and releases it when the voice ends", async () => {
    vi.useFakeTimers();
    const { audioEngine, cancelPlaybackGroup, endListeners } =
      createAudioEngine();
    const controller = new PresetAuditionController(audioEngine);

    await controller.audition({
      midiNote: 60,
      presetId: "piano",
      use: "preview",
    });
    await controller.audition({
      midiNote: 60,
      presetId: "plucked-string",
      use: "preview",
    });

    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-0");

    endListeners.get(voiceHandle(1))?.();
    expect(cancelPlaybackGroup).toHaveBeenCalledWith("group-1");
    controller.dispose();
  });

  it("does not schedule an obsolete preview that is still preparing", async () => {
    let resolveFirstPrime: (prepared: boolean) => void = () => undefined;
    let primeCall = 0;
    const { audioEngine, scheduleNote } = createAudioEngine();
    const controller = new PresetAuditionController({
      ...audioEngine,
      prime: () => {
        primeCall += 1;
        if (primeCall > 1) {
          return Promise.resolve(true);
        }
        return new Promise<boolean>((resolve) => {
          resolveFirstPrime = resolve;
        });
      },
    });

    const first = controller.audition({
      midiNote: 60,
      presetId: "piano",
      use: "preview",
    });
    const second = controller.audition({
      midiNote: 60,
      presetId: "plucked-string",
      use: "preview",
    });

    await expect(second).resolves.toBe(true);
    resolveFirstPrime(true);
    await expect(first).resolves.toBe(false);
    expect(scheduleNote).toHaveBeenCalledTimes(1);
    expect(scheduleNote.mock.calls[0]?.[0].presetId).toBe("plucked-string");
    controller.dispose();
  });

  it("invalidates active and pending previews when all audio stops", async () => {
    let resolvePrime: (prepared: boolean) => void = () => undefined;
    const { audioEngine, cancelPlaybackGroup, scheduleNote, stopAll } =
      createAudioEngine();
    const controller = new PresetAuditionController({
      ...audioEngine,
      prime: () =>
        new Promise<boolean>((resolve) => {
          resolvePrime = resolve;
        }),
    });

    const pending = controller.audition({
      midiNote: 60,
      presetId: "piano",
      use: "preview",
    });
    stopAll();
    resolvePrime(true);

    await expect(pending).resolves.toBe(false);
    expect(scheduleNote).not.toHaveBeenCalled();
    expect(cancelPlaybackGroup).not.toHaveBeenCalled();
    controller.dispose();
  });
});
