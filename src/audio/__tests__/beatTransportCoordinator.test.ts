import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RHYTHM_PPQ,
  type PercussionSampleId,
  type RhythmPattern,
} from "@/data/rhythmPresets";
import { BeatTransportCoordinator } from "@/audio/beatTransportCoordinator";
import {
  ExercisePlaybackCoordinator,
  type ExercisePlaybackAudioEngine,
  type ExercisePlaybackRequest,
  type ExerciseSchedulerFactory,
} from "@/audio/exercisePlaybackCoordinator";
import {
  RhythmPlaybackCoordinator,
  type RhythmPlaybackAudioEngine,
  type RhythmPlaybackRequest,
  type RhythmSchedulerFactory,
} from "@/audio/rhythmPlaybackCoordinator";
import { type PlaybackGroupHandle } from "@/audio/types";

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

async function flushPromises(count = 5) {
  for (let index = 0; index < count; index += 1) {
    await Promise.resolve();
  }
}

function createExerciseRequest(
  id = "exercise",
  countInBeats: ExercisePlaybackRequest["countInBeats"] = 0,
): ExercisePlaybackRequest {
  return {
    countInBeats,
    events: [
      {
        durationBeats: 1,
        midi: 60,
        offsetBeats: 0,
        stepIndex: 0,
      },
    ],
    id,
    metronomeEnabled: false,
    presetId: "piano",
    tempoBpm: 60,
  };
}

function createRhythmPattern(
  sampleId: PercussionSampleId = "kick",
): RhythmPattern {
  return {
    cycleTicks: RHYTHM_PPQ * 4,
    hits: [{ atTicks: 0, sampleId }],
    meter: { beats: 4, beatUnit: 4 },
    ppq: RHYTHM_PPQ,
  };
}

function createRhythmRequest(id = "rhythm"): RhythmPlaybackRequest {
  return {
    id,
    pattern: createRhythmPattern(),
    tempoBpm: 60,
  };
}

function createHarness({
  exercisePrime = async () => true,
  rhythmPrime = async () => true,
}: {
  exercisePrime?: ExercisePlaybackAudioEngine["prime"];
  rhythmPrime?: RhythmPlaybackAudioEngine["prime"];
} = {}) {
  let currentTime = 10;
  let nextGroupId = 0;
  const createPlaybackGroup = () =>
    `group-${nextGroupId++}` as PlaybackGroupHandle;
  const createExerciseScheduler: ExerciseSchedulerFactory = () => ({
    isRunning: () => true,
    start: vi.fn(),
    stop: vi.fn(),
  });
  const createRhythmScheduler: RhythmSchedulerFactory = () => ({
    isRunning: () => true,
    start: vi.fn(),
    stop: vi.fn(),
  });
  const exercise = new ExercisePlaybackCoordinator(
    {
      cancelPlaybackGroup: vi.fn(),
      createPlaybackGroup,
      getCurrentTime: () => currentTime,
      prime: exercisePrime,
      scheduleMetronomeClick: vi.fn(),
      scheduleNote: vi.fn(),
      subscribeToStopAll: () => () => undefined,
    },
    createExerciseScheduler,
  );
  const rhythm = new RhythmPlaybackCoordinator(
    {
      cancelPlaybackGroup: vi.fn(),
      createPlaybackGroup,
      getCurrentTime: () => currentTime,
      prime: rhythmPrime,
      schedulePercussionHit: vi.fn(),
      subscribeToStopAll: () => () => undefined,
    },
    createRhythmScheduler,
  );

  return {
    exercise,
    rhythm,
    setCurrentTime: (value: number) => {
      currentTime = value;
    },
    transport: new BeatTransportCoordinator(exercise, rhythm),
  };
}

describe("BeatTransportCoordinator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("restarts active rhythm on the exercise downbeat", async () => {
    vi.useFakeTimers();
    const { rhythm, setCurrentTime, transport } = createHarness();

    await rhythm.start(createRhythmRequest());
    setCurrentTime(20);

    await transport.startExercise(createExerciseRequest());

    expect(rhythm.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 10.08,
      pendingId: "rhythm",
      pendingOriginTime: 20.08,
      playing: true,
    });

    await vi.advanceTimersByTimeAsync(40);

    expect(rhythm.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 20.08,
      playing: true,
    });
  });

  it("aligns rhythm after an exercise count-in", async () => {
    vi.useFakeTimers();
    const { exercise, rhythm, setCurrentTime, transport } = createHarness();

    await rhythm.start(createRhythmRequest());
    setCurrentTime(20);

    await transport.startExercise(createExerciseRequest("exercise", 2));

    expect(exercise.getSnapshot()).toMatchObject({
      countInBeats: 2,
      countInStartTime: 20.08,
      originTime: 22.08,
      playing: true,
    });
    expect(rhythm.getSnapshot()).toMatchObject({
      originTime: 22.08,
      playing: true,
    });
    expect(rhythm.getSnapshot().pendingId).toBeUndefined();
  });

  it("syncs active rhythm with the exercise tempo when exercise restarts", async () => {
    vi.useFakeTimers();
    const { rhythm, setCurrentTime, transport } = createHarness();

    await rhythm.start(createRhythmRequest());
    setCurrentTime(20);

    await transport.startExercise({
      ...createExerciseRequest(),
      tempoBpm: 120,
    });

    expect(rhythm.getSnapshot()).toMatchObject({
      originTime: 10.08,
      pendingId: "rhythm",
      pendingOriginTime: 20.08,
      playing: true,
      tempoBpm: 60,
    });
    expect(rhythm.getPendingRequest()?.tempoBpm).toBe(120);

    await vi.advanceTimersByTimeAsync(40);

    expect(rhythm.getSnapshot()).toMatchObject({
      originTime: 20.08,
      playing: true,
      tempoBpm: 120,
    });
    expect(rhythm.getActiveRequest()?.tempoBpm).toBe(120);
  });

  it("starting rhythm restarts active exercise on the rhythm downbeat", async () => {
    vi.useFakeTimers();
    const { exercise, rhythm, setCurrentTime, transport } = createHarness();

    await exercise.start(createExerciseRequest("exercise"));
    setCurrentTime(12);

    await transport.startRhythm(createRhythmRequest());

    expect(rhythm.getSnapshot()).toMatchObject({
      originTime: 12.08,
      playing: true,
    });
    expect(exercise.getSnapshot()).toMatchObject({
      activeId: "exercise",
      originTime: 10.08,
      pendingId: "exercise",
      pendingOriginTime: 12.08,
      playing: true,
    });

    await vi.advanceTimersByTimeAsync(40);

    expect(exercise.getSnapshot()).toMatchObject({
      activeId: "exercise",
      originTime: 12.08,
      playing: true,
    });
  });

  it("syncs active exercise with the rhythm tempo when rhythm restarts", async () => {
    vi.useFakeTimers();
    const { exercise, setCurrentTime, transport } = createHarness();

    await exercise.start(createExerciseRequest("exercise"));
    setCurrentTime(12);

    await transport.startRhythm({
      ...createRhythmRequest(),
      tempoBpm: 120,
    });

    expect(exercise.getSnapshot()).toMatchObject({
      activeId: "exercise",
      originTime: 10.08,
      pendingId: "exercise",
      pendingOriginTime: 12.08,
      playing: true,
      secondsPerBeat: 1,
    });

    await vi.advanceTimersByTimeAsync(40);

    expect(exercise.getSnapshot()).toMatchObject({
      activeId: "exercise",
      originTime: 12.08,
      playing: true,
      secondsPerBeat: 0.5,
    });
    expect(exercise.getSnapshot().countInBeats).toBeUndefined();
    expect(exercise.getActiveRequest()?.tempoBpm).toBe(120);
  });

  it("cancels stale pending starts before they can resync playback", async () => {
    const exercisePrime = createDeferred<boolean>();
    const { exercise, rhythm, setCurrentTime, transport } = createHarness({
      exercisePrime: () => exercisePrime.promise,
    });

    const exerciseStart = transport.startExercise({
      ...createExerciseRequest(),
      tempoBpm: 120,
    });

    expect(exercise.getSnapshot()).toMatchObject({
      pendingId: "exercise",
      playing: false,
    });

    setCurrentTime(20);
    await transport.startRhythm(createRhythmRequest());
    exercisePrime.resolve(true);

    await expect(exerciseStart).resolves.toBe(false);
    expect(exercise.getSnapshot().playing).toBe(false);
    expect(rhythm.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 20.08,
      playing: true,
    });
  });

  it("cancels a pending companion rhythm sync when exercise is stopped", async () => {
    const rhythmPrime = createDeferred<boolean>();
    const { exercise, rhythm, setCurrentTime, transport } = createHarness({
      rhythmPrime: vi
        .fn<RhythmPlaybackAudioEngine["prime"]>()
        .mockResolvedValueOnce(true)
        .mockReturnValueOnce(rhythmPrime.promise),
    });

    await rhythm.start(createRhythmRequest());
    setCurrentTime(20);

    const exerciseStart = transport.startExercise({
      ...createExerciseRequest(),
      tempoBpm: 120,
    });

    await flushPromises();

    expect(exercise.getSnapshot()).toMatchObject({
      activeId: "exercise",
      playing: true,
    });
    expect(rhythm.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 10.08,
      pendingId: "rhythm",
      playing: true,
    });

    transport.stopExercise("exercise");
    rhythmPrime.resolve(true);

    await expect(exerciseStart).resolves.toBe(true);
    expect(exercise.getSnapshot().playing).toBe(false);
    expect(rhythm.getSnapshot()).toMatchObject({
      activeId: "rhythm",
      originTime: 10.08,
      playing: true,
    });
    expect(rhythm.getSnapshot().pendingId).toBeUndefined();
  });
});
