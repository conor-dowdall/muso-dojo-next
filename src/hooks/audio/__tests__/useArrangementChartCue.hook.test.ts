// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type PartSequencePlaybackPlan } from "@/audio";
import { useArrangementChartCue } from "@/hooks/audio/useArrangementChartCue";

const mocks = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const coordinator = {
    getClockTime: vi.fn(),
    getSnapshot: vi.fn(),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };

  return {
    coordinator,
    deriveArrangementChartCueTarget: vi.fn(),
    emit: () => listeners.forEach((listener) => listener()),
    setSnapshot(snapshot: unknown) {
      coordinator.getSnapshot.mockReturnValue(snapshot);
    },
  };
});

vi.mock("@/audio", () => ({
  partSequenceCoordinator: mocks.coordinator,
}));

vi.mock("@/utils/arrangement/arrangementChartCue", () => ({
  deriveArrangementChartCueTarget: mocks.deriveArrangementChartCueTarget,
}));

const plan = {
  completionPolicy: "loop",
  countIn: { durationBeats: 0, pulses: 0 },
  contentSignature: "content",
  mode: "arrangement",
  owner: { id: "arrangement-1", kind: "arrangement" },
  partResetSignatures: ["reset-a", "reset-b"],
  parts: [],
  sessionId: "arrangement-1",
  signature: "signature",
  sourceSignature: "source-1",
  tempoBpm: 120,
  updateSignature: "update",
} as PartSequencePlaybackPlan;

function activeSnapshot(sectionId = "section-a") {
  return {
    activeArrangementContext: {
      entryId: `entry-${sectionId}`,
      sectionId,
    },
    activeOccurrence: 2,
    activeSourcePartId: "part-a",
    mode: "arrangement",
    originTime: 4,
    playing: true,
    sourceSignature: "source-1",
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mocks.coordinator.getClockTime.mockReturnValue(5);
  mocks.deriveArrangementChartCueTarget.mockReturnValue(undefined);
  mocks.setSnapshot({ playing: false });
});

describe("useArrangementChartCue", () => {
  it("uses fallback context while playback is inactive", () => {
    const { result } = renderHook(() =>
      useArrangementChartCue(undefined, {
        entryId: "fallback-entry",
        sectionId: "fallback-section",
      }),
    );

    expect(result.current.presentation).toStrictEqual({
      entryId: "fallback-entry",
      kind: "current",
      sectionId: "fallback-section",
    });
  });

  it("reports the coordinator's current Section during playback", () => {
    mocks.setSnapshot(activeSnapshot());
    const { result } = renderHook(() =>
      useArrangementChartCue(plan, undefined),
    );

    expect(result.current.presentation).toStrictEqual({
      activeSourcePartId: "part-a",
      entryId: "entry-section-a",
      kind: "current",
      sectionId: "section-a",
    });
  });

  it("presents an upcoming Section when its cue time arrives", () => {
    mocks.setSnapshot(activeSnapshot());
    mocks.deriveArrangementChartCueTarget.mockReturnValue({
      boundaryTime: 7,
      cueTime: 6,
      effectiveLeadSeconds: 1,
      entryId: "entry-section-b",
      fromOccurrence: 2,
      sectionId: "section-b",
      sourceSignature: "source-1",
    });
    const { result } = renderHook(() =>
      useArrangementChartCue(plan, undefined),
    );

    act(() => vi.advanceTimersByTime(0));
    expect(result.current.presentation?.kind).toBe("current");

    act(() => vi.advanceTimersByTime(1_000));

    expect(result.current.presentation).toStrictEqual({
      boundaryTime: 7,
      entryId: "entry-section-b",
      kind: "upcoming",
      sectionId: "section-b",
    });
  });

  it("does not show a stale cue after playback reaches its target Section", () => {
    mocks.setSnapshot(activeSnapshot());
    mocks.deriveArrangementChartCueTarget.mockReturnValue({
      boundaryTime: 7,
      cueTime: 6,
      effectiveLeadSeconds: 1,
      entryId: "entry-section-b",
      fromOccurrence: 2,
      sectionId: "section-b",
      sourceSignature: "source-1",
    });
    const { result } = renderHook(() =>
      useArrangementChartCue(plan, undefined),
    );
    act(() => vi.advanceTimersByTime(0));

    mocks.setSnapshot(activeSnapshot("section-b"));
    act(() => vi.advanceTimersByTime(1_000));

    expect(result.current.presentation?.kind).toBe("current");
  });

  it("returns from an upcoming preview to the live Section at its boundary", () => {
    mocks.setSnapshot(activeSnapshot());
    mocks.deriveArrangementChartCueTarget.mockReturnValue({
      boundaryTime: 7,
      cueTime: 6,
      effectiveLeadSeconds: 1,
      entryId: "entry-section-b",
      fromOccurrence: 2,
      sectionId: "section-b",
      sourceSignature: "source-1",
    });
    const { result } = renderHook(() =>
      useArrangementChartCue(plan, undefined),
    );
    act(() => vi.advanceTimersByTime(0));
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.presentation?.kind).toBe("upcoming");

    act(() => {
      mocks.setSnapshot(activeSnapshot("section-b"));
      mocks.emit();
    });

    expect(result.current.presentation).toMatchObject({
      kind: "current",
      sectionId: "section-b",
    });
  });

  it("clears scheduled cues on unmount", () => {
    mocks.setSnapshot(activeSnapshot());
    mocks.deriveArrangementChartCueTarget.mockReturnValue({
      boundaryTime: 7,
      cueTime: 6,
      effectiveLeadSeconds: 1,
      entryId: "entry-section-b",
      fromOccurrence: 2,
      sectionId: "section-b",
      sourceSignature: "source-1",
    });
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = renderHook(() =>
      useArrangementChartCue(plan, undefined),
    );
    act(() => vi.advanceTimersByTime(0));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
