// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInstrumentNotes } from "@/hooks/instrument/useInstrumentNotes";
import { type ActiveNotes } from "@/types/instrument-active-note";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";

const audioMocks = vi.hoisted(() => ({
  ensureAudioReady: vi.fn(),
  getDefaultAudioPresetId: vi.fn(() => "piano"),
  playNote: vi.fn(),
  resolveAudioPreset: vi.fn(
    (): {
      defaultDurationSeconds: number;
      instrumentPreviewDurationSeconds?: number;
    } => ({
      defaultDurationSeconds: 1.08,
      instrumentPreviewDurationSeconds: 0.74,
    }),
  ),
}));

const playbackMocks = vi.hoisted(() => ({
  activeKeys: new Set<string>(),
  attach: vi.fn(),
  begin: vi.fn(),
  cancel: vi.fn(),
}));

const readiness = vi.hoisted(() => ({ status: "ready" }));

vi.mock("@/audio", () => ({
  ensureAudioReady: audioMocks.ensureAudioReady,
  getDefaultAudioPresetId: audioMocks.getDefaultAudioPresetId,
  musoAudioEngine: { playNote: audioMocks.playNote },
  resolveAudioPreset: audioMocks.resolveAudioPreset,
}));

vi.mock("@/hooks/audio/useAudioReadinessSnapshot", () => ({
  useAudioReadinessSnapshot: () => readiness,
}));

vi.mock("@/hooks/audio/usePlaybackActiveKeys", () => ({
  usePlaybackActiveKeys: () => playbackMocks,
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  readiness.status = "ready";
  let nextToken = 0;
  playbackMocks.begin.mockImplementation(() => ++nextToken);
  audioMocks.ensureAudioReady.mockResolvedValue(true);
  audioMocks.playNote.mockResolvedValue({ id: "voice-1" });
});

const generatedNotes: ActiveNotes = {
  c4: { midi: 60 },
};
const c4: InstrumentNoteInteractionTarget = {
  key: "c4",
  midi: 60,
  pitchClass: 0,
};

function renderInstrumentNotes(
  overrides: Partial<Parameters<typeof useInstrumentNotes>[0]> = {},
) {
  const getInitialActiveNotes = vi.fn(() => generatedNotes);
  const hook = renderHook(() =>
    useInstrumentNotes({
      activeDisplayFormatId: "midi",
      getInitialActiveNotes,
      noteInteractionMode: "play",
      previewAudioPresetId: "piano",
      ...overrides,
    }),
  );

  return { ...hook, getInitialActiveNotes };
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

describe("useInstrumentNotes", () => {
  it("starts playback immediately and attaches successful audio", async () => {
    const setActiveNotesLockSnapshot = vi.fn();
    const setActiveNotesSourceKey = vi.fn();
    const { result } = renderInstrumentNotes({
      setActiveNotesLockSnapshot,
      setActiveNotesSourceKey,
    });

    act(() => result.current.handleInteract(c4));

    expect(playbackMocks.begin).toHaveBeenCalledWith("c4");
    expect(audioMocks.playNote).toHaveBeenCalledWith({
      durationSeconds: 0.74,
      midiNote: 60,
      presetId: "piano",
      signal: undefined,
      use: "preview",
    });
    expect(audioMocks.ensureAudioReady).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(playbackMocks.attach).toHaveBeenCalledWith(
        "c4",
        1,
        { id: "voice-1" },
        0.74,
      ),
    );
    expect(setActiveNotesSourceKey).toHaveBeenCalledWith(
      JSON.stringify(["C", "major"]),
    );
    expect(setActiveNotesLockSnapshot).toHaveBeenCalledWith({
      activeNotes: generatedNotes,
      sourceKey: JSON.stringify(["C", "major"]),
    });
  });

  it("cancels a stale preparing request when a newer note supersedes it", async () => {
    readiness.status = "idle";
    const firstPlayback = createDeferred<{ id: string } | undefined>();
    audioMocks.playNote
      .mockImplementationOnce(() => firstPlayback.promise)
      .mockResolvedValueOnce({ id: "voice-2" });
    const d4: InstrumentNoteInteractionTarget = {
      key: "d4",
      midi: 62,
      pitchClass: 2,
    };
    const { result } = renderInstrumentNotes();

    act(() => result.current.handleInteract(c4));
    const firstSignal = audioMocks.playNote.mock.calls[0]?.[0].signal as
      AbortSignal | undefined;
    act(() => result.current.handleInteract(d4));

    expect(firstSignal?.aborted).toBe(true);
    expect(playbackMocks.cancel).toHaveBeenCalledWith("c4", 1);
    await waitFor(() =>
      expect(playbackMocks.attach).toHaveBeenCalledWith(
        "d4",
        2,
        { id: "voice-2" },
        0.74,
      ),
    );

    firstPlayback.resolve({ id: "stale-voice" });
    await act(async () => firstPlayback.promise);

    expect(playbackMocks.attach).not.toHaveBeenCalledWith(
      "c4",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("keeps the preset default when no shorter instrument preview is set", async () => {
    audioMocks.resolveAudioPreset.mockReturnValueOnce({
      defaultDurationSeconds: 0.62,
    });
    const { result } = renderInstrumentNotes({
      previewAudioPresetId: "plucked-string",
    });

    act(() => result.current.handleInteract(c4));

    expect(audioMocks.playNote).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 0.62 }),
    );
    await waitFor(() =>
      expect(playbackMocks.attach).toHaveBeenCalledWith(
        "c4",
        1,
        { id: "voice-1" },
        0.62,
      ),
    );
  });

  it("clears optimistic playback state when audio rejects", async () => {
    audioMocks.playNote.mockRejectedValueOnce(new Error("audio unavailable"));
    const { result } = renderInstrumentNotes();

    act(() => result.current.handleInteract(c4));

    await waitFor(() =>
      expect(playbackMocks.cancel).toHaveBeenCalledWith("c4", 1),
    );
    expect(playbackMocks.attach).not.toHaveBeenCalled();
  });

  it("aborts and clears pending playback on unmount", () => {
    readiness.status = "preparing";
    const pendingPlayback = createDeferred<{ id: string } | undefined>();
    audioMocks.playNote.mockReturnValueOnce(pendingPlayback.promise);
    const { result, unmount } = renderInstrumentNotes();

    act(() => result.current.handleInteract(c4));
    const signal = audioMocks.playNote.mock.calls[0]?.[0].signal as
      AbortSignal | undefined;
    unmount();

    expect(signal?.aborted).toBe(true);
    expect(playbackMocks.cancel).toHaveBeenCalledWith("c4", 1);
  });

  it("applies one-note and pitch-class edits without starting audio", () => {
    const onOneNoteChange = vi.fn();
    const cSharp4: InstrumentNoteInteractionTarget = {
      key: "c-sharp4",
      midi: 61,
      pitchClass: 1,
    };
    const cSharp5: InstrumentNoteInteractionTarget = {
      key: "c-sharp5",
      midi: 73,
      pitchClass: 1,
    };
    const oneNote = renderInstrumentNotes({
      activeNotes: generatedNotes,
      noteInteractionMode: "edit-one",
      noteTargets: [cSharp4, cSharp5],
      onActiveNotesChange: onOneNoteChange,
    });

    act(() => oneNote.result.current.handleInteract(cSharp4));

    expect(onOneNoteChange).toHaveBeenCalledWith({
      ...generatedNotes,
      "c-sharp4": { emphasis: "large", midi: 61 },
    });
    oneNote.unmount();

    const onPitchClassChange = vi.fn();
    const pitchClass = renderInstrumentNotes({
      activeNotes: generatedNotes,
      noteInteractionMode: "edit-pitch-class",
      noteTargets: [cSharp4, cSharp5],
      onActiveNotesChange: onPitchClassChange,
    });

    act(() => pitchClass.result.current.handleInteract(cSharp4));

    expect(onPitchClassChange).toHaveBeenCalledWith({
      ...generatedNotes,
      "c-sharp4": { emphasis: "large", midi: 61 },
      "c-sharp5": { emphasis: "large", midi: 73 },
    });
    expect(audioMocks.playNote).not.toHaveBeenCalled();
  });

  it("forces locked instruments into play mode and does not replace snapshots", () => {
    const onActiveNotesChange = vi.fn();
    const setActiveNotesLockSnapshot = vi.fn();
    const { result } = renderInstrumentNotes({
      activeNotes: generatedNotes,
      activeNotesLocked: true,
      noteInteractionMode: "edit-one",
      onActiveNotesChange,
      setActiveNotesLockSnapshot,
    });

    expect(result.current.noteInteractionMode).toBe("play");
    act(() => result.current.handleInteract(c4));

    expect(audioMocks.playNote).toHaveBeenCalledOnce();
    expect(onActiveNotesChange).not.toHaveBeenCalled();
    expect(setActiveNotesLockSnapshot).not.toHaveBeenCalled();
  });
});
