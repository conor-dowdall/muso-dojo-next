// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArrangementPlayFromEntryTransport } from "@/hooks/audio/useArrangementPlayFromEntryTransport";

const mocks = vi.hoisted(() => {
  const coordinator = {
    getSnapshot: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
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
      start: { countIn: { durationBeats: 2, pulses: 2 }, startIndex: 3 },
    },
    stopTransportPlayback: vi.fn(),
  };
});

vi.mock("@/audio", () => ({
  createArrangementPlaybackRequestFromEntry: mocks.createRequest,
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

describe("useArrangementPlayFromEntryTransport", () => {
  it("starts from the planner's Entry index through the exclusive handoff", () => {
    const { result } = renderHook(() =>
      useArrangementPlayFromEntryTransport("arrangement", "entry-b"),
    );

    expect(mocks.createRequest).toHaveBeenCalledWith(
      mocks.appState.arrangements.arrangement,
      "entry-b",
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

  it("stops active Play From Here playback without restarting it", () => {
    mocks.coordinator.getSnapshot.mockReturnValue({
      mode: "arrangement-from-entry",
      owner: { id: "arrangement", kind: "arrangement" },
      playing: true,
    });
    const { result } = renderHook(() =>
      useArrangementPlayFromEntryTransport("arrangement", "entry-b"),
    );

    expect(result.current.isActive).toBe(true);
    act(() => result.current.togglePlayback());
    expect(mocks.coordinator.stop).toHaveBeenCalledOnce();
    expect(mocks.coordinator.start).not.toHaveBeenCalled();
  });
});
