// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArrangementEntryLoopTransport } from "@/hooks/audio/useArrangementEntryLoopTransport";

const mocks = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const coordinator = {
    getSnapshot: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };
  return {
    appState: {
      arrangements: {
        arrangement: { entries: [], id: "arrangement" },
      } as Record<string, unknown>,
    },
    coordinator,
    createRequest: vi.fn(),
    ensureAudioReady: vi.fn(),
    request: {
      plan: { parts: [{}] },
      start: { countIn: { durationBeats: 0, pulses: 0 }, startIndex: 0 },
    },
    stopTransportPlayback: vi.fn(),
  };
});

vi.mock("@/audio", () => ({
  createArrangementEntryLoopPlaybackRequest: mocks.createRequest,
  ensureAudioReady: mocks.ensureAudioReady,
  partSequenceCoordinator: mocks.coordinator,
  stopTransportPlayback: mocks.stopTransportPlayback,
}));

vi.mock("@/stores/appStore", () => ({
  useAppStore: (selector: (state: typeof mocks.appState) => unknown) =>
    selector(mocks.appState),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.coordinator.getSnapshot.mockReturnValue({ playing: false });
  mocks.createRequest.mockReturnValue(mocks.request);
});

afterEach(cleanup);

describe("useArrangementEntryLoopTransport", () => {
  it("starts one Entry loop through the exclusive transport handoff", () => {
    const { result } = renderHook(() =>
      useArrangementEntryLoopTransport("arrangement", "entry-a"),
    );

    expect(result.current).toMatchObject({ canPlay: true, isActive: false });
    act(() => result.current.togglePlayback());
    expect(mocks.stopTransportPlayback).toHaveBeenCalledOnce();
    expect(mocks.ensureAudioReady).toHaveBeenCalledOnce();
    expect(mocks.coordinator.start).toHaveBeenCalledWith(
      mocks.request.plan,
      mocks.request.start,
    );
  });

  it("reports and stops only the exact active Arrangement Entry loop", () => {
    mocks.coordinator.getSnapshot.mockReturnValue({
      activeArrangementContext: { entryId: "entry-a" },
      mode: "arrangement-entry-loop",
      owner: { id: "arrangement", kind: "arrangement" },
      playing: true,
    });
    const { result } = renderHook(() =>
      useArrangementEntryLoopTransport("arrangement", "entry-a"),
    );

    expect(result.current.isActive).toBe(true);
    act(() => result.current.togglePlayback());
    expect(mocks.coordinator.stop).toHaveBeenCalledOnce();
    expect(mocks.coordinator.start).not.toHaveBeenCalled();
  });
});
