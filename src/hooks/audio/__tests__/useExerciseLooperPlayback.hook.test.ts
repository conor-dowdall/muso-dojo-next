// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useExerciseLooperPlayback } from "@/hooks/audio/useExerciseLooperPlayback";
import { type ExerciseSequenceStep } from "@/utils/exercise-looper/exerciseSequence";

const mocks = vi.hoisted(() => {
  const playbackListeners = new Set<() => void>();
  const auditionListeners = new Set<() => void>();
  const auditionSnapshot: ReadonlySet<string> = new Set();
  const exercisePlaybackCoordinator = {
    getActiveStepIndex: vi.fn(),
    getSnapshot: vi.fn(),
    setMetronomeEnabled: vi.fn(),
    subscribe: vi.fn((listener: () => void) => {
      playbackListeners.add(listener);
      return () => playbackListeners.delete(listener);
    }),
  };
  const auditionController = {
    audition: vi.fn(),
    cancel: vi.fn(),
    dispose: vi.fn(),
    getSnapshot: vi.fn(() => auditionSnapshot),
    subscribe: vi.fn((listener: () => void) => {
      auditionListeners.add(listener);
      return () => auditionListeners.delete(listener);
    }),
  };

  return {
    auditionController,
    beatTransportCoordinator: {
      retimeExercise: vi.fn(),
      startExercise: vi.fn(),
      stopExercise: vi.fn(),
    },
    createExercisePlaybackRequest: vi.fn(),
    ensureAudioReady: vi.fn(),
    exercisePlaybackCoordinator,
    restartRequestsAreEqual: vi.fn(),
    setSnapshot(snapshot: unknown) {
      exercisePlaybackCoordinator.getSnapshot.mockReturnValue(snapshot);
    },
    stopAllListener: undefined as (() => void) | undefined,
    stopAllUnsubscribe: vi.fn(),
    subscribeToStopAll: vi.fn(),
  };
});

vi.mock("@/audio", () => ({
  beatTransportCoordinator: mocks.beatTransportCoordinator,
  createExercisePlaybackRequest: mocks.createExercisePlaybackRequest,
  ensureAudioReady: mocks.ensureAudioReady,
  exercisePlaybackCoordinator: mocks.exercisePlaybackCoordinator,
  exercisePlaybackRestartRequestsAreEqual: mocks.restartRequestsAreEqual,
  ExerciseAuditionController: class {
    constructor() {
      return mocks.auditionController;
    }
  },
  getExercisePlaybackOwner: (
    snapshot: {
      pendingOwners?: Record<string, string>;
      playbacks: Record<string, { owner?: string }>;
    },
    id: string,
  ) => snapshot.playbacks[id]?.owner ?? snapshot.pendingOwners?.[id],
  isExercisePlaybackActive: (
    snapshot: {
      pendingIds: readonly string[];
      playbacks: Record<string, unknown>;
    },
    id: string,
  ) => snapshot.playbacks[id] !== undefined || snapshot.pendingIds.includes(id),
  musoAudioEngine: {
    getCurrentTime: () => undefined,
    getOutputClock: () => undefined,
    subscribeToStopAll: mocks.subscribeToStopAll,
  },
}));

const initialSteps: readonly ExerciseSequenceStep[] = [
  {
    durationUnits: 1,
    notes: [{ anchorPosition: 0, collectionPosition: 0, midi: 60 }],
  },
];

function renderPlayback(
  options: Partial<Parameters<typeof useExerciseLooperPlayback>[0]> = {},
) {
  return renderHook(
    ({ props }) =>
      useExerciseLooperPlayback({
        id: "exercise",
        metronomeEnabled: false,
        steps: initialSteps,
        subdivision: "1-per-beat",
        tempoBpm: 120,
        ...props,
      }),
    { initialProps: { props: options } },
  );
}

function activeSnapshot(owner: "manual" | "part-sequence" = "manual") {
  return {
    events: [],
    pendingIds: [],
    playbacks: {
      exercise: {
        countInBeats: 0,
        originTime: 10,
        owner,
      },
    },
    playing: true,
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  mocks.createExercisePlaybackRequest.mockImplementation(
    ({
      audioPresetId,
      countInBeats,
      id,
      metronomeEnabled,
      steps,
      tempoBpm,
    }) => ({
      countInBeats,
      events: steps.flatMap((step: ExerciseSequenceStep, stepIndex: number) =>
        step.notes.map((note) => ({
          durationBeats: step.durationUnits,
          midi: note.midi,
          offsetBeats: stepIndex,
          stepIndex,
        })),
      ),
      id,
      metronomeEnabled,
      presetId: audioPresetId ?? "piano",
      tempoBpm,
    }),
  );
  mocks.ensureAudioReady.mockResolvedValue(true);
  mocks.restartRequestsAreEqual.mockReturnValue(true);
  mocks.setSnapshot({
    events: [],
    pendingIds: [],
    playbacks: {},
    playing: false,
  });
  mocks.stopAllListener = undefined;
  mocks.subscribeToStopAll.mockImplementation((listener: () => void) => {
    mocks.stopAllListener = listener;
    return mocks.stopAllUnsubscribe;
  });
});

describe("useExerciseLooperPlayback", () => {
  it("starts with optional count-in and stops through the beat transport", () => {
    const { result } = renderPlayback();

    act(() => result.current.start());

    expect(mocks.auditionController.cancel).toHaveBeenCalledOnce();
    expect(mocks.ensureAudioReady).toHaveBeenCalledOnce();
    expect(mocks.beatTransportCoordinator.startExercise).toHaveBeenCalledWith(
      expect.objectContaining({ countInBeats: 0, id: "exercise" }),
    );

    act(() => result.current.startWithIntro(4));
    expect(
      mocks.beatTransportCoordinator.startExercise,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({ countInBeats: 4, id: "exercise" }),
    );

    act(() => result.current.stop());
    expect(mocks.beatTransportCoordinator.stopExercise).toHaveBeenCalledWith(
      "exercise",
    );
  });

  it("auditions one note or a chord with the current preset", () => {
    const { result } = renderPlayback({ audioPresetId: "bowed-strings" });
    const target = { key: "c4", midi: 60, pitchClass: 0 };

    act(() => result.current.audition(target));

    expect(mocks.ensureAudioReady).toHaveBeenCalledOnce();
    expect(mocks.auditionController.audition).toHaveBeenCalledWith({
      durationSeconds: 0.55,
      notes: [target],
      presetId: "bowed-strings",
      velocity: 0.72,
    });

    act(() => result.current.auditionChord([{ key: "e4", midi: 64 }]));
    expect(mocks.auditionController.audition).toHaveBeenLastCalledWith(
      expect.objectContaining({ notes: [{ key: "e4", midi: 64 }] }),
    );
  });

  it("retimes active manual playback when tempo changes", () => {
    mocks.setSnapshot(activeSnapshot());
    const { rerender } = renderPlayback();
    mocks.restartRequestsAreEqual.mockReturnValue(false);

    rerender({ props: { tempoBpm: 132 } });

    expect(mocks.beatTransportCoordinator.retimeExercise).toHaveBeenCalledWith(
      expect.objectContaining({ id: "exercise", tempoBpm: 132 }),
    );
    expect(mocks.beatTransportCoordinator.startExercise).not.toHaveBeenCalled();
  });

  it("restarts active manual playback for sequence changes", () => {
    mocks.setSnapshot(activeSnapshot());
    const { rerender } = renderPlayback();
    mocks.restartRequestsAreEqual.mockReturnValue(false);
    const nextSteps: readonly ExerciseSequenceStep[] = [
      {
        durationUnits: 1,
        notes: [{ anchorPosition: 1, collectionPosition: 1, midi: 62 }],
      },
    ];

    rerender({ props: { steps: nextSteps } });

    expect(mocks.beatTransportCoordinator.startExercise).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [expect.objectContaining({ midi: 62 })],
        id: "exercise",
      }),
    );
    expect(
      mocks.beatTransportCoordinator.retimeExercise,
    ).not.toHaveBeenCalled();
  });

  it("does not replace band-owned playback when module settings change", () => {
    mocks.setSnapshot(activeSnapshot("part-sequence"));
    const { rerender } = renderPlayback();
    mocks.restartRequestsAreEqual.mockReturnValue(false);

    rerender({ props: { tempoBpm: 140 } });

    expect(
      mocks.beatTransportCoordinator.retimeExercise,
    ).not.toHaveBeenCalled();
    expect(mocks.beatTransportCoordinator.startExercise).not.toHaveBeenCalled();
  });

  it("updates live metronome state and exposes count-in status", () => {
    mocks.setSnapshot({
      ...activeSnapshot(),
      playbacks: {
        exercise: {
          countInBeats: 4,
          originTime: 10,
          owner: "manual",
        },
      },
    });
    const { result } = renderPlayback({ metronomeEnabled: true });

    expect(
      mocks.exercisePlaybackCoordinator.setMetronomeEnabled,
    ).toHaveBeenCalledWith("exercise", true);
    expect(result.current.activeCountInBeats).toBe(4);
    expect(result.current).toMatchObject({
      isActive: true,
      isPending: false,
      isPlaying: true,
    });
  });

  it("cancels audition on global stop and disposes resources on unmount", () => {
    const { unmount } = renderPlayback();

    act(() => mocks.stopAllListener?.());
    expect(mocks.auditionController.cancel).toHaveBeenCalledOnce();

    unmount();

    expect(mocks.auditionController.dispose).toHaveBeenCalledOnce();
    expect(mocks.stopAllUnsubscribe).toHaveBeenCalledOnce();
  });
});
