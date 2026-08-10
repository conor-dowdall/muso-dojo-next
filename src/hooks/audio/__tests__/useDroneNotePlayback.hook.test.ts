// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type AudioPresetId } from "@/audio";
import {
  useDroneNotePlayback,
  type DroneNotePlaybackNote,
} from "@/hooks/audio/useDroneNotePlayback";

const mocks = vi.hoisted(() => ({
  activate: vi.fn(),
  clear: vi.fn(),
  createDrone: vi.fn(),
  destroyDrone: vi.fn(),
  ensureAudioReady: vi.fn(),
  register: vi.fn(),
  registerCleanup: vi.fn(),
  stopAllListener: undefined as (() => void) | undefined,
  stopAllUnsubscribe: vi.fn(),
  subscribeToStopAll: vi.fn(),
  updateDrone: vi.fn(),
}));

vi.mock("@/audio", () => ({
  ensureAudioReady: mocks.ensureAudioReady,
  getDefaultAudioPresetId: () => "synth-pad",
  musoAudioEngine: {
    createDrone: mocks.createDrone,
    destroyDrone: mocks.destroyDrone,
    subscribeToStopAll: mocks.subscribeToStopAll,
    updateDrone: mocks.updateDrone,
  },
}));

vi.mock("@/hooks/audio/dronePlaybackCoordinator", () => ({
  dronePlaybackCoordinator: {
    activate: mocks.activate,
    clear: mocks.clear,
    register: mocks.register,
  },
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.stopAllListener = undefined;
  mocks.createDrone.mockResolvedValue("drone-handle");
  mocks.ensureAudioReady.mockResolvedValue(true);
  mocks.register.mockReturnValue(mocks.registerCleanup);
  mocks.subscribeToStopAll.mockImplementation((listener: () => void) => {
    mocks.stopAllListener = listener;
    return mocks.stopAllUnsubscribe;
  });
  mocks.updateDrone.mockReturnValue(true);
});

function createNote(
  overrides: Partial<DroneNotePlaybackNote> = {},
): DroneNotePlaybackNote {
  return {
    collectionDegreeSignature: "1,3,5",
    collectionPosition: 0,
    collectionSize: 3,
    interval: 0,
    intervalDegree: 1,
    midi: 48,
    ...overrides,
  };
}

describe("useDroneNotePlayback", () => {
  it("prepares and creates a persistent Drone on first activation", async () => {
    const note = createNote();
    const { result } = renderHook(() =>
      useDroneNotePlayback({ id: "drone-1", notes: [note] }),
    );

    act(() => result.current.toggleNote(note));

    expect(mocks.ensureAudioReady).toHaveBeenCalledOnce();
    expect(mocks.activate).toHaveBeenCalledWith("drone-1");
    await waitFor(() => expect(result.current.isNoteActive(note)).toBe(true));
    expect(result.current.activeIntervals).toStrictEqual([0]);
    expect(mocks.createDrone).toHaveBeenCalledWith({
      notes: [{ id: "0", midiNote: 48, velocity: 0.65 }],
      presetId: "synth-pad",
      use: "drone",
    });
  });

  it("reconciles active notes and preset changes through the current handle", async () => {
    const initialNote = createNote();
    const { rerender, result } = renderHook(
      ({ audioPresetId, notes }) =>
        useDroneNotePlayback({ audioPresetId, id: "drone-1", notes }),
      {
        initialProps: {
          audioPresetId: "piano" as AudioPresetId,
          notes: [initialNote],
        },
      },
    );

    act(() => result.current.toggleNote(initialNote));
    await waitFor(() => expect(mocks.createDrone).toHaveBeenCalledOnce());

    const movedNote = createNote({ midi: 50 });
    rerender({ audioPresetId: "bowed-strings", notes: [movedNote] });

    await waitFor(() =>
      expect(mocks.updateDrone).toHaveBeenLastCalledWith("drone-handle", {
        notes: [{ id: "0", midiNote: 50, velocity: 0.65 }],
        presetId: "bowed-strings",
        use: "drone",
      }),
    );
    expect(result.current.isNoteActive(movedNote)).toBe(true);
  });

  it("stops and clears coordinator ownership", async () => {
    const note = createNote();
    const { result } = renderHook(() =>
      useDroneNotePlayback({ id: "drone-1", notes: [note] }),
    );
    act(() => result.current.toggleNote(note));
    await waitFor(() =>
      expect(result.current.activeIntervals).toStrictEqual([0]),
    );

    act(() => result.current.stopAll());

    expect(result.current.activeIntervals).toStrictEqual([]);
    expect(mocks.updateDrone).toHaveBeenLastCalledWith("drone-handle", {
      notes: [],
      presetId: "synth-pad",
      use: "drone",
    });
    expect(mocks.clear).toHaveBeenCalledWith("drone-1");
  });

  it("resets visible state when the audio engine stops everything", async () => {
    const note = createNote();
    const { result } = renderHook(() =>
      useDroneNotePlayback({ id: "drone-1", notes: [note] }),
    );
    act(() => result.current.toggleNote(note));
    await waitFor(() => expect(result.current.isNoteActive(note)).toBe(true));

    act(() => mocks.stopAllListener?.());

    expect(result.current.activeIntervals).toStrictEqual([]);
    expect(result.current.isNoteActive(note)).toBe(false);
    expect(mocks.clear).toHaveBeenCalledWith("drone-1");
  });

  it("unregisters, unsubscribes, and destroys its handle on unmount", async () => {
    const note = createNote();
    const { result, unmount } = renderHook(() =>
      useDroneNotePlayback({ id: "drone-1", notes: [note] }),
    );
    act(() => result.current.toggleNote(note));
    await waitFor(() => expect(mocks.createDrone).toHaveBeenCalledOnce());

    unmount();

    expect(mocks.registerCleanup).toHaveBeenCalledOnce();
    expect(mocks.stopAllUnsubscribe).toHaveBeenCalledOnce();
    expect(mocks.destroyDrone).toHaveBeenCalledWith("drone-handle");
  });
});
