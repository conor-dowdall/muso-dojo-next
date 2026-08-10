// @vitest-environment jsdom

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionPlaybackReconciliation } from "@/hooks/audio/useSessionPlaybackReconciliation";

const mocks = vi.hoisted(() => ({
  exercise: {
    cancelPendingStart: vi.fn(),
    getActiveIds: vi.fn(),
    getSnapshot: vi.fn(),
    stop: vi.fn(),
  },
  rhythm: {
    cancelPendingStart: vi.fn(),
    getActiveIds: vi.fn(),
    getSnapshot: vi.fn(),
    stop: vi.fn(),
  },
  state: {
    sessions: {} as Record<string, unknown>,
  },
}));

vi.mock("@/audio", () => ({
  exercisePlaybackCoordinator: mocks.exercise,
  rhythmPlaybackCoordinator: mocks.rhythm,
}));

vi.mock("@/stores/appStore", () => ({
  useAppStore: (selector: (state: typeof mocks.state) => unknown) =>
    selector(mocks.state),
}));

function setSessionModules(modules: Array<{ id: string; type: string }>) {
  mocks.state.sessions = {
    session: {
      id: "session",
      parts: [{ id: "part", modules }],
    },
  };
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  setSessionModules([
    { id: "exercise-valid", type: "exercise-looper" },
    { id: "rhythm-valid", type: "rhythm" },
  ]);
  mocks.exercise.getActiveIds.mockReturnValue([]);
  mocks.exercise.getSnapshot.mockReturnValue({
    pendingIds: [],
    pendingOwners: {},
  });
  mocks.rhythm.getActiveIds.mockReturnValue([]);
  mocks.rhythm.getSnapshot.mockReturnValue({
    pendingIds: [],
    pendingOwners: {},
  });
});

describe("useSessionPlaybackReconciliation", () => {
  it("stops and cancels only stale manual playback", () => {
    mocks.exercise.getActiveIds.mockReturnValue([
      "exercise-valid",
      "exercise-stale",
    ]);
    mocks.exercise.getSnapshot.mockReturnValue({
      pendingIds: ["exercise-valid", "exercise-pending", "exercise-band"],
      pendingOwners: {
        "exercise-band": "part-sequence",
        "exercise-pending": "manual",
        "exercise-valid": "manual",
      },
    });
    mocks.rhythm.getActiveIds.mockReturnValue(["rhythm-valid", "rhythm-stale"]);
    mocks.rhythm.getSnapshot.mockReturnValue({
      pendingIds: ["rhythm-pending", "rhythm-band"],
      pendingOwners: {
        "rhythm-band": "part-sequence",
        "rhythm-pending": "manual",
      },
    });

    renderHook(() => useSessionPlaybackReconciliation("session"));

    expect(mocks.exercise.stop).toHaveBeenCalledTimes(1);
    expect(mocks.exercise.stop).toHaveBeenCalledWith("exercise-stale");
    expect(mocks.exercise.cancelPendingStart).toHaveBeenCalledTimes(1);
    expect(mocks.exercise.cancelPendingStart).toHaveBeenCalledWith(
      "exercise-pending",
    );
    expect(mocks.rhythm.stop).toHaveBeenCalledTimes(1);
    expect(mocks.rhythm.stop).toHaveBeenCalledWith("rhythm-stale");
    expect(mocks.rhythm.cancelPendingStart).toHaveBeenCalledTimes(1);
    expect(mocks.rhythm.cancelPendingStart).toHaveBeenCalledWith(
      "rhythm-pending",
    );
  });

  it("retires all manual playback when no Session is selected", () => {
    mocks.exercise.getActiveIds.mockReturnValue(["exercise-active"]);
    mocks.exercise.getSnapshot.mockReturnValue({
      pendingIds: ["exercise-pending"],
      pendingOwners: { "exercise-pending": "manual" },
    });
    mocks.rhythm.getActiveIds.mockReturnValue(["rhythm-active"]);
    mocks.rhythm.getSnapshot.mockReturnValue({
      pendingIds: ["rhythm-pending"],
      pendingOwners: { "rhythm-pending": "manual" },
    });

    renderHook(() => useSessionPlaybackReconciliation(null));

    expect(mocks.exercise.stop).toHaveBeenCalledWith("exercise-active");
    expect(mocks.exercise.cancelPendingStart).toHaveBeenCalledWith(
      "exercise-pending",
    );
    expect(mocks.rhythm.stop).toHaveBeenCalledWith("rhythm-active");
    expect(mocks.rhythm.cancelPendingStart).toHaveBeenCalledWith(
      "rhythm-pending",
    );
  });

  it("reconciles playback when modules are removed from the Session", () => {
    mocks.exercise.getActiveIds.mockReturnValue(["exercise-valid"]);
    mocks.rhythm.getActiveIds.mockReturnValue(["rhythm-valid"]);
    const { rerender } = renderHook(() =>
      useSessionPlaybackReconciliation("session"),
    );
    expect(mocks.exercise.stop).not.toHaveBeenCalled();
    expect(mocks.rhythm.stop).not.toHaveBeenCalled();

    setSessionModules([]);
    rerender();

    expect(mocks.exercise.stop).toHaveBeenCalledWith("exercise-valid");
    expect(mocks.rhythm.stop).toHaveBeenCalledWith("rhythm-valid");
  });
});
