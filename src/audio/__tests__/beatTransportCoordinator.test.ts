import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BeatTransportCoordinator,
  type CountInPlaybackAudioEngine,
} from "@/audio/beatTransportCoordinator";
import {
  ExercisePlaybackCoordinator,
  type ExercisePlaybackAudioEngine,
  type ExercisePlaybackRequest,
} from "@/audio/exercisePlaybackCoordinator";
import {
  RhythmPlaybackCoordinator,
  type RhythmPlaybackAudioEngine,
  type RhythmPlaybackRequest,
} from "@/audio/rhythmPlaybackCoordinator";
import { RHYTHM_PPQ, type RhythmPattern } from "@/data/rhythmPresets";
import { type LookaheadScheduler } from "@/audio/lookaheadScheduler";
import { type PlaybackGroupHandle } from "@/audio/types";

function createScheduler(): LookaheadScheduler {
  return { isRunning: () => true, start: vi.fn(), stop: vi.fn() };
}

function createPattern(): RhythmPattern {
  return {
    cycleTicks: RHYTHM_PPQ * 4,
    hits: [{ atTicks: 0, sampleId: "kick" }],
    meter: { beats: 4, beatUnit: 4 },
    ppq: RHYTHM_PPQ,
  };
}

function createExerciseRequest(
  id: string,
  settings: Partial<ExercisePlaybackRequest> = {},
): ExercisePlaybackRequest {
  return {
    countInBeats: 0,
    events: [{ durationBeats: 1, midi: 60, offsetBeats: 0, stepIndex: 0 }],
    id,
    metronomeEnabled: false,
    presetId: "piano",
    tempoBpm: 60,
    ...settings,
  };
}

function createRhythmRequest(
  id: string,
  settings: Partial<RhythmPlaybackRequest> = {},
): RhythmPlaybackRequest {
  return { id, pattern: createPattern(), tempoBpm: 60, ...settings };
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function createHarness({
  exercisePrime = async () => true,
  rhythmPrime = async () => true,
}: {
  exercisePrime?: ExercisePlaybackAudioEngine["prime"];
  rhythmPrime?: RhythmPlaybackAudioEngine["prime"];
} = {}) {
  let currentTime = 10;
  let exerciseGroup = 0;
  let rhythmGroup = 0;
  const exerciseEngine: ExercisePlaybackAudioEngine = {
    cancelPlaybackGroup: vi.fn(),
    createPlaybackGroup: () =>
      `exercise-${exerciseGroup++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime: exercisePrime,
    scheduleMetronomeClick: vi.fn(() => true),
    scheduleNote: vi.fn(),
    subscribeToStopAll: () => () => undefined,
  };
  const rhythmEngine: RhythmPlaybackAudioEngine = {
    cancelPlaybackGroup: vi.fn(),
    createPlaybackGroup: () => `rhythm-${rhythmGroup++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime: rhythmPrime,
    schedulePercussionHit: vi.fn(() => true),
    subscribeToStopAll: () => () => undefined,
  };
  const countInAudio: CountInPlaybackAudioEngine = {
    cancelPlaybackGroup: vi.fn(),
    createPlaybackGroup: () => "count-in" as PlaybackGroupHandle,
    prime: async () => true,
    scheduleMetronomeClick: vi.fn(() => true),
  };
  const exercise = new ExercisePlaybackCoordinator(
    exerciseEngine,
    createScheduler,
    createScheduler,
  );
  const rhythm = new RhythmPlaybackCoordinator(rhythmEngine, createScheduler);
  const transport = new BeatTransportCoordinator(
    exercise,
    rhythm,
    countInAudio,
  );

  return {
    exercise,
    exerciseEngine,
    countInAudio,
    rhythm,
    rhythmEngine,
    setCurrentTime: (value: number) => {
      currentTime = value;
    },
    transport,
  };
}

describe("BeatTransportCoordinator", () => {
  afterEach(() => vi.useRealTimers());

  it("starts local Looper and Rhythm layers without restarting companions", async () => {
    const { exercise, rhythm, setCurrentTime, transport } = createHarness();
    await transport.startRhythm(createRhythmRequest("rhythm"));
    setCurrentTime(10.2);
    await transport.startExercise(createExerciseRequest("exercise"));

    expect(rhythm.getSnapshot().playbacks.rhythm?.originTime).toBe(10.08);
    expect(exercise.getSnapshot().playbacks.exercise?.originTime).toBe(11.08);
  });

  it("quantizes a replacement Rhythm and retires the previous one", async () => {
    vi.useFakeTimers();
    const { rhythm, setCurrentTime, transport } = createHarness();
    await transport.startRhythm(createRhythmRequest("a"));
    setCurrentTime(10.2);
    await transport.startRhythm(createRhythmRequest("b"));

    expect(rhythm.getSnapshot().playbacks.a?.originTime).toBe(10.08);
    expect(rhythm.getSnapshot().playbacks.b?.originTime).toBe(11.08);

    await vi.advanceTimersByTimeAsync(900);
    expect(rhythm.getSnapshot().playbacks.a).toBeUndefined();
    expect(rhythm.getSnapshot().playbacks.b).toBeDefined();
  });

  it("enforces one Part request per role on one explicit origin", async () => {
    const { exercise, rhythm, transport } = createHarness();
    const result = await transport.startPart({
      exercises: [
        createExerciseRequest("exercise-a"),
        createExerciseRequest("exercise-b"),
      ],
      originTime: 24,
      rhythms: [
        createRhythmRequest("rhythm-a"),
        createRhythmRequest("rhythm-b"),
      ],
      source: "part-sequence",
    });

    expect(result).toEqual({ originTime: 24, started: true });
    expect(
      Object.values(exercise.getSnapshot().playbacks).map(
        (playback) => playback.originTime,
      ),
    ).toEqual([24]);
    expect(
      Object.values(rhythm.getSnapshot().playbacks).map(
        (playback) => playback.originTime,
      ),
    ).toEqual([24]);
  });

  it("chooses a shared origin only after both coordinators are prepared", async () => {
    const { exercise, rhythm, setCurrentTime, transport } = createHarness();
    setCurrentTime(12);
    const result = await transport.startPart({
      exercises: [createExerciseRequest("exercise")],
      rhythms: [createRhythmRequest("rhythm")],
      source: "part-sequence",
    });

    expect(result.originTime).toBe(12.08);
    expect(exercise.getSnapshot().playbacks.exercise?.originTime).toBe(12.08);
    expect(rhythm.getSnapshot().playbacks.rhythm?.originTime).toBe(12.08);
  });

  it("fails atomically when preparation rejects before choosing an origin", async () => {
    const { exercise, rhythm, transport } = createHarness({
      exercisePrime: async () => {
        throw new Error("preparation failed");
      },
    });

    await expect(
      transport.startPart({
        exercises: [createExerciseRequest("exercise")],
        rhythms: [createRhythmRequest("rhythm")],
        source: "part-sequence",
      }),
    ).resolves.toEqual({ originTime: undefined, started: false });
    expect(exercise.getSnapshot().playbacks).toEqual({});
    expect(rhythm.getSnapshot().playbacks).toEqual({});
  });

  it("rolls back a prepared layer when its companion cannot start", async () => {
    const { countInAudio, exercise, rhythm, transport } = createHarness({
      rhythmPrime: async () => false,
    });

    await expect(
      transport.startPart({
        countIn: { durationBeats: 4, pulses: 4 },
        exercises: [createExerciseRequest("exercise")],
        originTime: 24,
        rhythms: [createRhythmRequest("rhythm")],
        source: "part-sequence",
      }),
    ).resolves.toEqual({ originTime: 24, started: false });
    expect(countInAudio.cancelPlaybackGroup).toHaveBeenCalledWith("count-in");
    expect(exercise.getSnapshot().playbacks).toEqual({});
    expect(rhythm.getSnapshot().playbacks).toEqual({});
  });

  it("rolls back a Rhythm when its exercise companion cannot start", async () => {
    const { exercise, rhythm, transport } = createHarness({
      exercisePrime: async () => false,
    });

    await expect(
      transport.startPart({
        exercises: [createExerciseRequest("exercise")],
        originTime: 24,
        rhythms: [createRhythmRequest("rhythm")],
        source: "part-sequence",
      }),
    ).resolves.toEqual({ originTime: 24, started: false });
    expect(exercise.getSnapshot().playbacks).toEqual({});
    expect(rhythm.getSnapshot().playbacks).toEqual({});
  });

  it("schedules one count-in bar before the shared downbeat", async () => {
    const { countInAudio, exercise, rhythm, transport } = createHarness();
    const result = await transport.startPart({
      countIn: { durationBeats: 4, pulses: 4 },
      exercises: [createExerciseRequest("exercise")],
      rhythms: [createRhythmRequest("rhythm")],
      source: "part-sequence",
    });

    expect(result.originTime).toBe(14.08);
    expect(exercise.getSnapshot().playbacks.exercise?.originTime).toBe(14.08);
    expect(rhythm.getSnapshot().playbacks.rhythm?.originTime).toBe(14.08);
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenCalledTimes(4);
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenNthCalledWith(1, {
      accent: true,
      group: "count-in",
      startTime: 10.08,
    });
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenNthCalledWith(4, {
      accent: false,
      group: "count-in",
      startTime: 13.08,
    });

    transport.stopPartPlayback();
    expect(countInAudio.cancelPlaybackGroup).toHaveBeenCalledWith("count-in");
  });

  it("keeps a final short Part's count-in when registering its future boundary", async () => {
    const { countInAudio, transport } = createHarness();
    const result = await transport.startPart({
      countIn: { durationBeats: 4, pulses: 4 },
      rhythms: [createRhythmRequest("one-beat-ending")],
      source: "part-sequence",
    });

    transport.stopPartPlayback("part-sequence", {
      atTime: result.originTime! + 1,
    });

    expect(countInAudio.scheduleMetronomeClick).toHaveBeenCalledTimes(4);
    expect(countInAudio.cancelPlaybackGroup).not.toHaveBeenCalled();

    transport.stopPartPlayback();
    expect(countInAudio.cancelPlaybackGroup).toHaveBeenCalledWith("count-in");
  });

  it("uses compound-meter pulses across the full bar duration", async () => {
    const { countInAudio, transport } = createHarness();
    const result = await transport.startPart({
      countIn: { durationBeats: 3, pulses: 2 },
      rhythms: [createRhythmRequest("rhythm")],
      source: "part-sequence",
    });

    expect(result.originTime).toBe(13.08);
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenNthCalledWith(1, {
      accent: true,
      group: "count-in",
      startTime: 10.08,
    });
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenNthCalledWith(2, {
      accent: false,
      group: "count-in",
      startTime: 11.58,
    });
  });

  it("restarts a manual Looper count-in when its tempo changes", async () => {
    const { exercise, setCurrentTime, transport } = createHarness();
    await transport.startExercise(
      createExerciseRequest("exercise", { countInBeats: 4 }),
    );
    setCurrentTime(11);

    await transport.retimeExercise(
      createExerciseRequest("exercise", { tempoBpm: 120 }),
    );

    expect(exercise.getSnapshot().playbacks.exercise).toMatchObject({
      countInBeats: 4,
      countInStartTime: 11.08,
      originTime: 13.08,
      secondsPerBeat: 0.5,
    });
  });

  it("replaces an active count-in and queued Part on one future pulse", async () => {
    const { countInAudio, exercise, rhythm, setCurrentTime, transport } =
      createHarness();
    await transport.startPart({
      countIn: { durationBeats: 4, pulses: 4 },
      exercises: [createExerciseRequest("exercise")],
      rhythms: [createRhythmRequest("rhythm")],
      source: "part-sequence",
    });
    setCurrentTime(11);

    const result = await transport.startPart({
      countIn: { durationBeats: 4, pulses: 4 },
      exercises: [createExerciseRequest("exercise", { tempoBpm: 120 })],
      originTime: 13.08,
      replacementTime: 11.08,
      rhythms: [createRhythmRequest("rhythm", { tempoBpm: 120 })],
      source: "part-sequence",
      tempoBpm: 120,
    });

    expect(result).toEqual({ originTime: 13.08, started: true });
    expect(countInAudio.cancelPlaybackGroup).toHaveBeenCalledWith("count-in", {
      atTime: 11.08,
    });
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenNthCalledWith(5, {
      accent: true,
      group: "count-in",
      startTime: 11.08,
    });
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenNthCalledWith(8, {
      accent: false,
      group: "count-in",
      startTime: 12.58,
    });
    expect(exercise.getSnapshot().playbacks.exercise?.originTime).toBe(13.08);
    expect(rhythm.getSnapshot().playbacks.rhythm?.originTime).toBe(13.08);
  });

  it("plays the count-in even when both backing lanes are silent", async () => {
    const { countInAudio, transport } = createHarness();
    const result = await transport.startPart({
      countIn: { durationBeats: 4, pulses: 4 },
      source: "part-sequence",
      tempoBpm: 60,
    });

    expect(result).toEqual({ originTime: 14.08, started: true });
    expect(countInAudio.scheduleMetronomeClick).toHaveBeenCalledTimes(4);
  });

  it("reports only manual controls to sequence listeners", async () => {
    const { transport } = createHarness();
    const listener = vi.fn();
    transport.subscribeToManualControl(listener);

    await transport.startPart({
      exercises: [createExerciseRequest("band")],
      source: "part-sequence",
    });
    expect(listener).not.toHaveBeenCalled();

    await transport.startExercise(createExerciseRequest("manual"));
    expect(listener).toHaveBeenCalledWith({
      kind: "start",
      owner: "manual",
      target: "exercise",
    });
  });

  it("ignores lifecycle cleanup for band-owned layers", async () => {
    const { exercise, rhythm, transport } = createHarness();
    await transport.startPart({
      exercises: [createExerciseRequest("exercise")],
      rhythms: [createRhythmRequest("rhythm")],
      source: "part-sequence",
    });

    transport.stopExercise("exercise", { source: "lifecycle" });
    transport.stopRhythm("rhythm", { source: "lifecycle" });

    expect(exercise.getSnapshot().playbacks.exercise).toBeDefined();
    expect(rhythm.getSnapshot().playbacks.rhythm).toBeDefined();
  });

  it("preserves a parent-bar Rhythm while replacing the Part exercise", async () => {
    const { exercise, rhythm, transport } = createHarness();
    const parentRhythm = createRhythmRequest("bar-rhythm");
    await transport.startPart({
      exercises: [createExerciseRequest("exercise-a")],
      originTime: 12,
      rhythms: [parentRhythm],
      source: "part-sequence",
    });
    await transport.startPart({
      exercises: [createExerciseRequest("exercise-b")],
      handoff: true,
      originTime: 14,
      preserveRhythms: true,
      rhythms: [parentRhythm],
      source: "part-sequence",
    });

    expect(exercise.getSnapshot().playbacks["exercise-b"]).toBeDefined();
    expect(rhythm.getSnapshot().playbacks["bar-rhythm"]).toMatchObject({
      originTime: 12,
    });
  });

  it("restarts a preserved Rhythm if a late handoff must move to another beat", async () => {
    const { rhythm, setCurrentTime, transport } = createHarness();
    const parentRhythm = createRhythmRequest("bar-rhythm");
    await transport.startPart({
      originTime: 12,
      rhythms: [parentRhythm],
      source: "part-sequence",
    });
    setCurrentTime(14.2);

    const result = await transport.startPart({
      handoff: true,
      originTime: 14,
      preserveRhythms: true,
      rhythms: [parentRhythm],
      source: "part-sequence",
    });

    expect(result).toEqual({ originTime: 15, started: true });
    expect(rhythm.getSnapshot().playbacks["bar-rhythm"]).toMatchObject({
      originTime: 15,
    });
  });

  it("recovers a missing parent-bar Rhythm instead of preserving silence", async () => {
    const { rhythm, transport } = createHarness();
    const parentRhythm = createRhythmRequest("bar-rhythm");
    await transport.startPart({
      originTime: 12,
      rhythms: [parentRhythm],
      source: "part-sequence",
    });
    rhythm.stop("bar-rhythm");

    await transport.startPart({
      handoff: true,
      originTime: 14,
      preserveRhythms: true,
      rhythms: [parentRhythm],
      source: "part-sequence",
    });

    expect(rhythm.getSnapshot().playbacks["bar-rhythm"]).toMatchObject({
      originTime: 14,
    });
  });

  it("replaces local layers when the Part transport takes ownership", async () => {
    vi.useFakeTimers();
    const { exercise, rhythm, transport } = createHarness();
    await transport.startExercise(createExerciseRequest("manual-exercise"));
    await transport.startRhythm(createRhythmRequest("manual-rhythm"));
    await transport.startPart({
      exercises: [createExerciseRequest("band-exercise")],
      rhythms: [createRhythmRequest("band-rhythm")],
      source: "part-sequence",
      stopMissing: false,
    });

    await vi.advanceTimersByTimeAsync(100);

    expect(exercise.getSnapshot().playbacks["manual-exercise"]).toBeUndefined();
    expect(rhythm.getSnapshot().playbacks["manual-rhythm"]).toBeUndefined();
    expect(exercise.getSnapshot().playbacks["band-exercise"]).toBeDefined();
    expect(rhythm.getSnapshot().playbacks["band-rhythm"]).toBeDefined();

    transport.stopPartPlayback();

    expect(exercise.getSnapshot().playbacks["band-exercise"]).toBeUndefined();
    expect(rhythm.getSnapshot().playbacks["band-rhythm"]).toBeUndefined();
  });

  it("forwards a musical release to every Part playback layer", async () => {
    const { exerciseEngine, rhythmEngine, transport } = createHarness();
    await transport.startPart({
      exercises: [createExerciseRequest("ending-note")],
      rhythms: [createRhythmRequest("ending-percussion")],
      source: "part-sequence",
    });

    transport.stopPartPlayback("part-sequence", {
      atTime: 12,
      releaseSeconds: 1.4,
    });

    expect(exerciseEngine.cancelPlaybackGroup).toHaveBeenCalledWith(
      "exercise-0",
      { atTime: 12, releaseSeconds: 1.4 },
    );
    expect(rhythmEngine.cancelPlaybackGroup).toHaveBeenCalledWith("rhythm-0", {
      atTime: 12,
      releaseSeconds: 1.4,
    });
  });

  it("cancels pending Part layers when the sequence stops", async () => {
    const exerciseReady = createDeferred<boolean>();
    const rhythmReady = createDeferred<boolean>();
    const { exercise, rhythm, transport } = createHarness({
      exercisePrime: () => exerciseReady.promise,
      rhythmPrime: () => rhythmReady.promise,
    });
    const start = transport.startPart({
      exercises: [createExerciseRequest("band-exercise")],
      originTime: 24,
      rhythms: [createRhythmRequest("band-rhythm")],
      source: "part-sequence",
    });

    expect(exercise.getPendingIds("part-sequence")).toEqual(["band-exercise"]);
    expect(rhythm.getPendingIds("part-sequence")).toEqual(["band-rhythm"]);

    transport.stopPartPlayback();
    exerciseReady.resolve(true);
    rhythmReady.resolve(true);

    await expect(start).resolves.toEqual({
      originTime: 24,
      started: false,
    });
    expect(exercise.getSnapshot().pendingIds).toEqual([]);
    expect(rhythm.getSnapshot().pendingIds).toEqual([]);
    expect(exercise.getSnapshot().playbacks).toEqual({});
    expect(rhythm.getSnapshot().playbacks).toEqual({});
  });

  it("does not let a preparing Part start resurrect after a global transport stop", async () => {
    const exerciseReady = createDeferred<boolean>();
    const rhythmReady = createDeferred<boolean>();
    const { exercise, rhythm, transport } = createHarness({
      exercisePrime: () => exerciseReady.promise,
      rhythmPrime: () => rhythmReady.promise,
    });
    const start = transport.startPart({
      exercises: [createExerciseRequest("old-session-exercise")],
      rhythms: [createRhythmRequest("old-session-rhythm")],
      source: "part-sequence",
    });

    transport.stopAllPlayback();
    exerciseReady.resolve(true);
    rhythmReady.resolve(true);

    await expect(start).resolves.toEqual({
      originTime: undefined,
      started: false,
    });
    expect(exercise.getSnapshot().pendingIds).toEqual([]);
    expect(rhythm.getSnapshot().pendingIds).toEqual([]);
    expect(exercise.getSnapshot().playbacks).toEqual({});
    expect(rhythm.getSnapshot().playbacks).toEqual({});
  });

  it("stops all active manual beat lanes at a workspace boundary", async () => {
    const { exercise, rhythm, transport } = createHarness();
    await transport.startExercise(createExerciseRequest("manual-exercise"));
    await transport.startRhythm(createRhythmRequest("manual-rhythm"));

    transport.stopAllPlayback();

    expect(exercise.getSnapshot().pendingIds).toEqual([]);
    expect(rhythm.getSnapshot().pendingIds).toEqual([]);
    expect(exercise.getSnapshot().playbacks).toEqual({});
    expect(rhythm.getSnapshot().playbacks).toEqual({});
  });
});
