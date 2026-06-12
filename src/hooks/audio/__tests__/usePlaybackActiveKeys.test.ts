import { afterEach, describe, expect, it, vi } from "vitest";
import { createPlaybackActiveKeysController } from "@/hooks/audio/usePlaybackActiveKeys";

describe("createPlaybackActiveKeysController", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps a key active until its playback handle ends", () => {
    vi.useFakeTimers();
    const snapshots: string[][] = [];
    let endPlayback: () => void = () => undefined;
    const controller = createPlaybackActiveKeysController<string>({
      onActiveKeysChange: (keys) => snapshots.push([...keys]),
      subscribeToEnd: (_handle, listener) => {
        endPlayback = listener;
        return () => undefined;
      },
    });

    const token = controller.begin("note-c4");
    controller.attach("note-c4", token, "voice-1", 0.5);
    vi.advanceTimersByTime(500);

    expect(controller.getActiveKeys().has("note-c4")).toBe(true);

    endPlayback();

    expect(controller.getActiveKeys().has("note-c4")).toBe(false);
    expect(snapshots).toStrictEqual([["note-c4"], []]);
  });

  it("ignores the end of an earlier repeated note", () => {
    vi.useFakeTimers();
    const listeners = new Map<string, () => void>();
    const controller = createPlaybackActiveKeysController<string>({
      subscribeToEnd: (handle, listener) => {
        listeners.set(handle, listener);
        return () => listeners.delete(handle);
      },
    });

    const firstToken = controller.begin("note-c4");
    controller.attach("note-c4", firstToken, "voice-1", 0.5);
    const endFirstPlayback = listeners.get("voice-1");
    const secondToken = controller.begin("note-c4");
    controller.attach("note-c4", secondToken, "voice-2", 0.5);

    endFirstPlayback?.();
    expect(controller.getActiveKeys().has("note-c4")).toBe(true);

    listeners.get("voice-2")?.();
    expect(controller.getActiveKeys().has("note-c4")).toBe(false);
  });

  it("clears failed playback and stalled end notifications", () => {
    vi.useFakeTimers();
    const controller = createPlaybackActiveKeysController<string>({
      subscribeToEnd: () => () => undefined,
    });

    const failedToken = controller.begin("failed");
    controller.cancel("failed", failedToken);
    expect(controller.getActiveKeys().has("failed")).toBe(false);

    const fallbackToken = controller.begin("fallback");
    controller.attach("fallback", fallbackToken, "voice-1", 0.5);
    vi.advanceTimersByTime(1_499);
    expect(controller.getActiveKeys().has("fallback")).toBe(true);

    vi.advanceTimersByTime(1);
    expect(controller.getActiveKeys().has("fallback")).toBe(false);
  });
});
