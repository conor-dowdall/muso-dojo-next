// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useArrangementTransport } from "@/hooks/audio/useArrangementTransport";

const mocks = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const coordinator = {
    getSnapshot: vi.fn(),
    restartCurrentPart: vi.fn(),
    retimeCurrentPart: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    updatePlan: vi.fn(),
  };

  return {
    appState: {
      arrangements: {
        "arrangement-1": { id: "arrangement-1", name: "Set List" },
      } as Record<string, unknown>,
    },
    coordinator,
    createArrangementPlaybackRequest: vi.fn(),
    emit: () => listeners.forEach((listener) => listener()),
    ensureAudioReady: vi.fn(),
    getPartSequencePlanReconciliation: vi.fn(),
    request: {
      plan: { sourceSignature: "plan-1", steps: [] },
      start: { owner: { id: "arrangement-1", kind: "arrangement" } },
    },
    setSnapshot(snapshot: unknown) {
      coordinator.getSnapshot.mockReturnValue(snapshot);
    },
    stopTransportPlayback: vi.fn(),
  };
});

vi.mock("@/audio", () => ({
  createArrangementPlaybackRequest: mocks.createArrangementPlaybackRequest,
  ensureAudioReady: mocks.ensureAudioReady,
  getPartSequencePlanReconciliation: mocks.getPartSequencePlanReconciliation,
  partSequenceCoordinator: mocks.coordinator,
  stopTransportPlayback: mocks.stopTransportPlayback,
}));

vi.mock("@/hooks/interaction/useScopedTransportShortcuts", () => ({
  useScopedTransportShortcuts: ({ isActive }: { isActive: boolean }) => ({
    isActive,
    scope: "arrangement",
  }),
}));

vi.mock("@/stores/appStore", () => ({
  useAppStore: (selector: (state: typeof mocks.appState) => unknown) =>
    selector(mocks.appState),
}));

afterEach(() => {
  cleanup();
  document
    .querySelectorAll("dialog, input")
    .forEach((element) => element.remove());
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.appState.arrangements = {
    "arrangement-1": { id: "arrangement-1", name: "Set List" },
  };
  mocks.createArrangementPlaybackRequest.mockReturnValue(mocks.request);
  mocks.ensureAudioReady.mockResolvedValue(true);
  mocks.getPartSequencePlanReconciliation.mockReturnValue("none");
  mocks.coordinator.start.mockResolvedValue(undefined);
  mocks.coordinator.restartCurrentPart.mockResolvedValue(undefined);
  mocks.coordinator.retimeCurrentPart.mockResolvedValue(undefined);
  mocks.setSnapshot({ playing: false });
});

function activeSnapshot() {
  return {
    activeArrangementContext: {
      entryId: "entry-2",
      playCount: 3,
      playIndex: 1,
      sectionId: "section-2",
    },
    owner: { id: "arrangement-1", kind: "arrangement" },
    pendingArrangementContext: { entryId: "entry-3" },
    playing: true,
  };
}

describe("useArrangementTransport", () => {
  it("starts an available arrangement after stopping competing transport", () => {
    const { result } = renderHook(() =>
      useArrangementTransport("arrangement-1"),
    );

    expect(result.current.canPlay).toBe(true);
    act(() => result.current.togglePlayback());

    expect(mocks.stopTransportPlayback).toHaveBeenCalledOnce();
    expect(mocks.ensureAudioReady).toHaveBeenCalledOnce();
    expect(mocks.coordinator.start).toHaveBeenCalledWith(
      mocks.request.plan,
      mocks.request.start,
    );
  });

  it("reports active arrangement context and stops the active transport", () => {
    mocks.setSnapshot(activeSnapshot());
    const { result } = renderHook(() =>
      useArrangementTransport("arrangement-1"),
    );

    expect(result.current).toMatchObject({
      activeEntryId: "entry-2",
      activePlayCount: 3,
      activePlayIndex: 1,
      isActive: true,
      pendingEntryId: "entry-3",
      shortcuts: { isActive: true, scope: "arrangement" },
    });

    act(() => result.current.togglePlayback());

    expect(mocks.coordinator.stop).toHaveBeenCalledOnce();
    expect(mocks.coordinator.start).not.toHaveBeenCalled();
  });

  it("does nothing when the arrangement no longer exists", () => {
    mocks.appState.arrangements = {};
    const { result } = renderHook(() =>
      useArrangementTransport("arrangement-1"),
    );

    expect(result.current.canPlay).toBe(false);
    act(() => result.current.togglePlayback());

    expect(mocks.stopTransportPlayback).not.toHaveBeenCalled();
    expect(mocks.coordinator.start).not.toHaveBeenCalled();
  });

  it("applies each plan reconciliation action to active playback", () => {
    mocks.setSnapshot(activeSnapshot());
    mocks.getPartSequencePlanReconciliation.mockReturnValue("retime");
    renderHook(() => useArrangementTransport("arrangement-1"));

    expect(mocks.coordinator.retimeCurrentPart).toHaveBeenCalledWith(
      mocks.request.plan,
    );

    act(() => {
      mocks.getPartSequencePlanReconciliation.mockReturnValue("restart");
      mocks.setSnapshot({ ...activeSnapshot(), revision: 2 });
      mocks.emit();
    });
    expect(mocks.coordinator.restartCurrentPart).toHaveBeenCalledWith(
      mocks.request.plan,
    );

    act(() => {
      mocks.getPartSequencePlanReconciliation.mockReturnValue("update");
      mocks.setSnapshot({ ...activeSnapshot(), revision: 3 });
      mocks.emit();
    });
    expect(mocks.coordinator.updatePlan).toHaveBeenCalledWith(
      mocks.request.plan,
    );

    act(() => {
      mocks.getPartSequencePlanReconciliation.mockReturnValue("stop");
      mocks.setSnapshot({ ...activeSnapshot(), revision: 4 });
      mocks.emit();
    });
    expect(mocks.coordinator.stop).toHaveBeenCalledOnce();
  });

  it("handles Shift+Space outside editable and modal contexts and cleans up", () => {
    const { unmount } = renderHook(() =>
      useArrangementTransport("arrangement-1"),
    );
    const shortcut = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "Space",
      key: " ",
      shiftKey: true,
    });

    act(() => window.dispatchEvent(shortcut));

    expect(shortcut.defaultPrevented).toBe(true);
    expect(mocks.coordinator.start).toHaveBeenCalledOnce();

    mocks.coordinator.start.mockClear();
    const input = document.createElement("input");
    document.body.append(input);
    act(() =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          code: "Space",
          key: " ",
          shiftKey: true,
        }),
      ),
    );

    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "");
    document.body.append(dialog);
    act(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          cancelable: true,
          code: "Space",
          key: " ",
          shiftKey: true,
        }),
      ),
    );
    expect(mocks.coordinator.start).not.toHaveBeenCalled();

    unmount();
    dialog.remove();
    act(() =>
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          cancelable: true,
          code: "Space",
          key: " ",
          shiftKey: true,
        }),
      ),
    );
    expect(mocks.coordinator.start).not.toHaveBeenCalled();
  });
});
