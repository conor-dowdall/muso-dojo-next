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

function createExerciseRequest(id: string): ExercisePlaybackRequest {
  return {
    countInBeats: 0,
    events: [{ durationBeats: 1, midi: 60, offsetBeats: 0, stepIndex: 0 }],
    id,
    metronomeEnabled: false,
    presetId: "piano",
    tempoBpm: 60,
  };
}

function createRhythmRequest(id: string): RhythmPlaybackRequest {
  return { id, pattern: createPattern(), tempoBpm: 60 };
}

function createHarness() {
  let currentTime = 10;
  let exerciseGroup = 0;
  let rhythmGroup = 0;
  const exerciseEngine: ExercisePlaybackAudioEngine = {
    cancelPlaybackGroup: vi.fn(),
    createPlaybackGroup: () =>
      `exercise-${exerciseGroup++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime: async () => true,
    scheduleMetronomeClick: vi.fn(() => true),
    scheduleNote: vi.fn(),
    subscribeToStopAll: () => () => undefined,
  };
  const rhythmEngine: RhythmPlaybackAudioEngine = {
    cancelPlaybackGroup: vi.fn(),
    createPlaybackGroup: () => `rhythm-${rhythmGroup++}` as PlaybackGroupHandle,
    getCurrentTime: () => currentTime,
    prime: async () => true,
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
    countInAudio,
    rhythm,
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
});
