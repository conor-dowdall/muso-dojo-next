// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRhythmPlayback } from "@/hooks/audio/useRhythmPlayback";
import {
  DEFAULT_RHYTHM_SELECTION,
  type RhythmSelection,
} from "@/utils/rhythm/rhythmConfig";

const mocks = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const rhythmPlaybackCoordinator = {
    getSnapshot: vi.fn(),
    setPattern: vi.fn(),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };

  return {
    beatTransportCoordinator: {
      startRhythm: vi.fn(),
      stopRhythm: vi.fn(),
    },
    emit: () => listeners.forEach((listener) => listener()),
    ensureAudioReady: vi.fn(),
    rhythmPlaybackCoordinator,
    setSnapshot(snapshot: unknown) {
      rhythmPlaybackCoordinator.getSnapshot.mockReturnValue(snapshot);
    },
  };
});

vi.mock("@/audio", () => ({
  beatTransportCoordinator: mocks.beatTransportCoordinator,
  ensureAudioReady: mocks.ensureAudioReady,
  getRhythmPlaybackOwner: (
    snapshot: {
      pendingOwners?: Record<string, string>;
      playbacks: Record<string, { owner?: string }>;
    },
    id: string,
  ) => snapshot.playbacks[id]?.owner ?? snapshot.pendingOwners?.[id],
  isRhythmPlaybackActive: (
    snapshot: {
      pendingIds: readonly string[];
      playbacks: Record<string, unknown>;
    },
    id: string,
  ) => snapshot.playbacks[id] !== undefined || snapshot.pendingIds.includes(id),
  rhythmPlaybackCoordinator: mocks.rhythmPlaybackCoordinator,
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setSnapshot({ pendingIds: [], playbacks: {}, playing: false });
  mocks.ensureAudioReady.mockResolvedValue(true);
  mocks.beatTransportCoordinator.startRhythm.mockResolvedValue(undefined);
});

function activeSnapshot(owner: "manual" | "part-sequence" = "manual") {
  return {
    pendingIds: [],
    playbacks: {
      rhythm: { owner },
    },
    playing: true,
  };
}

function withTimekeeperSound(sound: "hat" | "ride"): RhythmSelection {
  return {
    recipe: {
      ...DEFAULT_RHYTHM_SELECTION.recipe,
      timekeeper: {
        ...DEFAULT_RHYTHM_SELECTION.recipe.timekeeper,
        sound,
      },
    },
    source: "recipe",
  };
}

describe("useRhythmPlayback", () => {
  it("prepares, starts, and stops a manual rhythm", () => {
    const { result } = renderHook(() =>
      useRhythmPlayback({
        id: "rhythm",
        rhythm: DEFAULT_RHYTHM_SELECTION,
        tempoBpm: 120,
      }),
    );

    act(() => result.current.start());

    expect(mocks.ensureAudioReady).toHaveBeenCalledOnce();
    expect(mocks.beatTransportCoordinator.startRhythm).toHaveBeenCalledWith({
      id: "rhythm",
      pattern: expect.objectContaining({ hits: expect.any(Array) }),
      tempoBpm: 120,
    });

    act(() => result.current.stop());
    expect(mocks.beatTransportCoordinator.stopRhythm).toHaveBeenCalledWith(
      "rhythm",
    );
  });

  it("restarts active manual playback when tempo changes", () => {
    mocks.setSnapshot(activeSnapshot());
    const { rerender, result } = renderHook(
      ({ tempoBpm }) =>
        useRhythmPlayback({
          id: "rhythm",
          rhythm: DEFAULT_RHYTHM_SELECTION,
          tempoBpm,
        }),
      { initialProps: { tempoBpm: 120 } },
    );

    expect(result.current).toMatchObject({ isActive: true, isPlaying: true });
    expect(mocks.beatTransportCoordinator.startRhythm).not.toHaveBeenCalled();

    rerender({ tempoBpm: 132 });

    expect(mocks.beatTransportCoordinator.startRhythm).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rhythm", tempoBpm: 132 }),
    );
  });

  it("updates only the pattern for a timekeeper-only change", () => {
    mocks.setSnapshot(activeSnapshot());
    const initialRhythm = withTimekeeperSound("hat");
    const nextRhythm = withTimekeeperSound("ride");
    const { rerender } = renderHook(
      ({ rhythm }) =>
        useRhythmPlayback({ id: "rhythm", rhythm, tempoBpm: 120 }),
      { initialProps: { rhythm: initialRhythm } },
    );

    rerender({ rhythm: nextRhythm });

    expect(mocks.rhythmPlaybackCoordinator.setPattern).toHaveBeenCalledWith(
      "rhythm",
      expect.objectContaining({ hits: expect.any(Array) }),
    );
    expect(mocks.beatTransportCoordinator.startRhythm).not.toHaveBeenCalled();
  });

  it("replaces a pending manual start with the latest settings", () => {
    mocks.setSnapshot({
      pendingIds: ["rhythm"],
      pendingOwners: { rhythm: "manual" },
      playbacks: {},
      playing: false,
    });
    const { rerender } = renderHook(
      ({ tempoBpm }) =>
        useRhythmPlayback({
          id: "rhythm",
          rhythm: DEFAULT_RHYTHM_SELECTION,
          tempoBpm,
        }),
      { initialProps: { tempoBpm: 120 } },
    );

    rerender({ tempoBpm: 132 });

    expect(mocks.beatTransportCoordinator.startRhythm).toHaveBeenCalledWith(
      expect.objectContaining({ id: "rhythm", tempoBpm: 132 }),
    );
  });

  it("leaves all band-owned setting updates to the band transport", () => {
    mocks.setSnapshot(activeSnapshot("part-sequence"));
    const initialRhythm = withTimekeeperSound("hat");
    const { rerender } = renderHook(
      ({ rhythm, tempoBpm }) =>
        useRhythmPlayback({
          id: "rhythm",
          rhythm,
          tempoBpm,
        }),
      { initialProps: { rhythm: initialRhythm, tempoBpm: 120 } },
    );

    rerender({ rhythm: withTimekeeperSound("ride"), tempoBpm: 120 });
    rerender({ rhythm: initialRhythm, tempoBpm: 140 });

    expect(mocks.beatTransportCoordinator.startRhythm).not.toHaveBeenCalled();
    expect(mocks.rhythmPlaybackCoordinator.setPattern).not.toHaveBeenCalled();
  });

  it("tracks coordinator snapshot changes", () => {
    const { result } = renderHook(() =>
      useRhythmPlayback({
        id: "rhythm",
        rhythm: DEFAULT_RHYTHM_SELECTION,
        tempoBpm: 120,
      }),
    );

    expect(result.current).toMatchObject({ isActive: false, isPlaying: false });

    act(() => {
      mocks.setSnapshot(activeSnapshot());
      mocks.emit();
    });

    expect(result.current).toMatchObject({ isActive: true, isPlaying: true });
  });
});
