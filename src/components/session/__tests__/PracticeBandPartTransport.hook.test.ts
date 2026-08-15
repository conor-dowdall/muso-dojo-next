// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePartBandPlayFromHereTransport } from "@/components/session/PracticeBandTransport";

const mocks = vi.hoisted(() => {
  const coordinator = {
    getSnapshot: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  };
  return {
    appState: {
      sessions: {
        session: { id: "session", parts: [{ id: "part-b" }] },
      } as Record<string, unknown>,
    },
    coordinator,
    createRequest: vi.fn(),
    ensureAudioReady: vi.fn(),
    request: {
      plan: { parts: [{}] },
      start: { countIn: { durationBeats: 2, pulses: 2 }, startIndex: 1 },
    },
    stopTransportPlayback: vi.fn(),
  };
});

vi.mock("@/audio", () => ({
  createPartSequencePlaybackPlan: vi.fn(),
  createSessionPlaybackRequestFromPart: mocks.createRequest,
  ensureAudioReady: mocks.ensureAudioReady,
  getPartSequencePlanReconciliation: vi.fn(),
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

describe("usePartBandPlayFromHereTransport", () => {
  it("starts at the selected Part through the exclusive transport handoff", () => {
    const { result } = renderHook(() =>
      usePartBandPlayFromHereTransport("session", "part-b"),
    );

    expect(mocks.createRequest).toHaveBeenCalledWith(
      mocks.appState.sessions.session,
      "part-b",
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

  it("stops active Session-from-Part playback without restarting", () => {
    mocks.coordinator.getSnapshot.mockReturnValue({
      mode: "session-from-part",
      playing: true,
      sessionId: "session",
    });
    const { result } = renderHook(() =>
      usePartBandPlayFromHereTransport("session", "part-b"),
    );

    expect(result.current.isActive).toBe(true);
    act(() => result.current.togglePlayback());
    expect(mocks.coordinator.stop).toHaveBeenCalledOnce();
    expect(mocks.coordinator.start).not.toHaveBeenCalled();
  });
});
