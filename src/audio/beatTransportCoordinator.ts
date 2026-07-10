import {
  exercisePlaybackCoordinator,
  getExercisePlaybackOwner,
  type ExercisePlaybackCoordinator,
  type ExercisePlaybackRequest,
  type ExercisePlaybackSnapshot,
} from "./exercisePlaybackCoordinator";
import {
  getRhythmPlaybackOwner,
  rhythmPlaybackCoordinator,
  type RhythmPlaybackCoordinator,
  type RhythmPlaybackRequest,
  type RhythmPlaybackSnapshot,
} from "./rhythmPlaybackCoordinator";
import {
  getPlaybackOwnerForSource,
  type PlaybackOwner,
} from "./playbackOwnership";

const TRANSPORT_START_LEAD_SECONDS = 0.08;
const BEAT_GRID_EPSILON = 1e-6;

export type BeatTransportStartSource = PlaybackOwner;
export type BeatTransportControlSource = BeatTransportStartSource | "lifecycle";

export interface BeatTransportManualControlEvent {
  kind: "start" | "stop";
  owner: PlaybackOwner;
  target: "exercise" | "rhythm";
}

interface BeatGrid {
  originTime: number;
  secondsPerBeat: number;
}

export interface BeatTransportPartStartRequest {
  exercises?: readonly ExercisePlaybackRequest[];
  handoff?: boolean;
  originTime?: number;
  rhythms?: readonly RhythmPlaybackRequest[];
  source?: BeatTransportStartSource;
  stopMissing?: boolean;
}

function normalizeTempo(tempoBpm: number) {
  return Math.min(300, Math.max(30, Math.round(tempoBpm)));
}

function getNextBeatOrigin({
  currentTime,
  grid,
}: {
  currentTime: number;
  grid: BeatGrid;
}) {
  const minimumStartTime = currentTime + TRANSPORT_START_LEAD_SECONDS;
  if (minimumStartTime <= grid.originTime) {
    return grid.originTime;
  }

  const elapsedBeats =
    (minimumStartTime - grid.originTime) / grid.secondsPerBeat;
  return (
    grid.originTime +
    Math.ceil(elapsedBeats - BEAT_GRID_EPSILON) * grid.secondsPerBeat
  );
}

function getManualExerciseGrid(
  snapshot: ExercisePlaybackSnapshot,
): BeatGrid | undefined {
  const playback = Object.values(snapshot.playbacks).find(
    (candidate) => candidate.owner === "manual",
  );
  return playback
    ? {
        originTime: playback.originTime,
        secondsPerBeat: playback.secondsPerBeat,
      }
    : undefined;
}

function getManualRhythmGrid(
  snapshot: RhythmPlaybackSnapshot,
): BeatGrid | undefined {
  const playback = Object.values(snapshot.playbacks).find(
    (candidate) => candidate.owner === "manual",
  );
  return playback
    ? {
        originTime: playback.originTime,
        secondsPerBeat: 60 / normalizeTempo(playback.tempoBpm),
      }
    : undefined;
}

function getTempoBpm(
  exercises: readonly ExercisePlaybackRequest[],
  rhythms: readonly RhythmPlaybackRequest[],
) {
  return exercises[0]?.tempoBpm ?? rhythms[0]?.tempoBpm;
}

export class BeatTransportCoordinator {
  private manualControlListeners = new Set<
    (event: BeatTransportManualControlEvent) => void
  >();
  private revision = 0;

  constructor(
    private readonly exercise: ExercisePlaybackCoordinator = exercisePlaybackCoordinator,
    private readonly rhythm: RhythmPlaybackCoordinator = rhythmPlaybackCoordinator,
  ) {}

  private notifyManualControl(
    event: Omit<BeatTransportManualControlEvent, "owner">,
    source: BeatTransportControlSource = "manual",
  ) {
    if (source !== "manual") {
      return;
    }

    const owner = getPlaybackOwnerForSource(source);
    this.manualControlListeners.forEach((listener) =>
      listener({ ...event, owner }),
    );
  }

  subscribeToManualControl = (
    listener: (event: BeatTransportManualControlEvent) => void,
  ) => {
    this.manualControlListeners.add(listener);
    return () => this.manualControlListeners.delete(listener);
  };

  subscribeToManualStart = (listener: () => void) =>
    this.subscribeToManualControl((event) => {
      if (event.kind === "start") {
        listener();
      }
    });

  getCurrentTime = () =>
    this.exercise.getCurrentTime() ?? this.rhythm.getCurrentTime();

  private getManualGrid() {
    return (
      getManualExerciseGrid(this.exercise.getSnapshot()) ??
      getManualRhythmGrid(this.rhythm.getSnapshot())
    );
  }

  async startExercise(
    request: ExercisePlaybackRequest,
    options: { source?: BeatTransportStartSource } = {},
  ) {
    this.notifyManualControl(
      { kind: "start", target: "exercise" },
      options.source,
    );
    this.revision += 1;
    const currentTime = this.getCurrentTime();
    const grid = request.countInBeats === 0 ? this.getManualGrid() : undefined;
    const originTime =
      currentTime !== undefined && grid
        ? getNextBeatOrigin({ currentTime, grid })
        : undefined;
    const started = await this.exercise.start(request, {
      ...(originTime === undefined ? {} : { originTime }),
      owner: getPlaybackOwnerForSource(options.source),
    });

    return started;
  }

  async startRhythm(
    request: RhythmPlaybackRequest,
    options: { source?: BeatTransportStartSource } = {},
  ) {
    this.notifyManualControl(
      { kind: "start", target: "rhythm" },
      options.source,
    );
    this.revision += 1;
    const currentTime = this.getCurrentTime();
    const grid = this.getManualGrid();
    const originTime =
      currentTime !== undefined && grid
        ? getNextBeatOrigin({ currentTime, grid })
        : undefined;
    const started = await this.rhythm.start(request, {
      ...(originTime === undefined ? {} : { originTime }),
      owner: getPlaybackOwnerForSource(options.source),
    });

    return started;
  }

  async startPart({
    exercises = [],
    handoff = false,
    originTime,
    rhythms = [],
    source = "manual",
    stopMissing = true,
  }: BeatTransportPartStartRequest) {
    this.notifyManualControl({ kind: "start", target: "exercise" }, source);
    const revision = ++this.revision;
    const owner = getPlaybackOwnerForSource(source);
    const preparesFreshOrigin =
      originTime === undefined && (exercises.length > 0 || rhythms.length > 0);

    if (preparesFreshOrigin) {
      const prepared = await Promise.all([
        exercises.length > 0 ? this.exercise.prepare() : Promise.resolve(true),
        rhythms.length > 0 ? this.rhythm.prepare() : Promise.resolve(true),
      ]);
      if (revision !== this.revision || prepared.some((ready) => !ready)) {
        return { originTime: undefined, started: false };
      }
    }

    const currentTime = this.getCurrentTime();
    const tempoBpm = getTempoBpm(exercises, rhythms);
    const requestedOrigin =
      originTime ??
      (currentTime === undefined
        ? undefined
        : currentTime + TRANSPORT_START_LEAD_SECONDS);
    const resolvedOriginTime =
      handoff &&
      currentTime !== undefined &&
      requestedOrigin !== undefined &&
      tempoBpm !== undefined
        ? getNextBeatOrigin({
            currentTime,
            grid: {
              originTime: requestedOrigin,
              secondsPerBeat: 60 / normalizeTempo(tempoBpm),
            },
          })
        : requestedOrigin;

    if (stopMissing) {
      this.exercise
        .getActiveIds(owner)
        .forEach((id) =>
          this.exercise.stop(id, { atTime: resolvedOriginTime }),
        );
      this.rhythm
        .getActiveIds(owner)
        .forEach((id) => this.rhythm.stop(id, { atTime: resolvedOriginTime }));
    }

    const results = await Promise.all([
      ...exercises.map((request) =>
        this.exercise.start(request, {
          handoff,
          owner,
          originTime: resolvedOriginTime,
          prepared: preparesFreshOrigin,
        }),
      ),
      ...rhythms.map((request) =>
        this.rhythm.start(request, {
          handoff,
          owner,
          originTime: resolvedOriginTime,
          prepared: preparesFreshOrigin,
        }),
      ),
    ]);

    return {
      originTime: resolvedOriginTime,
      started:
        revision === this.revision &&
        results.length > 0 &&
        results.every(Boolean),
    };
  }

  updatePartLive({
    exercises = [],
    rhythms = [],
  }: Pick<BeatTransportPartStartRequest, "exercises" | "rhythms">) {
    exercises.forEach((request) =>
      this.exercise.setMetronomeEnabled(request.id, request.metronomeEnabled),
    );
    rhythms.forEach((request) =>
      this.rhythm.setPattern(request.id, request.pattern),
    );
  }

  stopExercise(
    id?: string,
    options: { source?: BeatTransportControlSource } = {},
  ) {
    if (options.source === "lifecycle" && id !== undefined) {
      const owner = getExercisePlaybackOwner(this.exercise.getSnapshot(), id);
      if (owner === "part-sequence") {
        return;
      }
    }

    this.notifyManualControl(
      { kind: "stop", target: "exercise" },
      options.source,
    );
    this.revision += 1;
    this.exercise.stop(id);
  }

  stopRhythm(
    id?: string,
    options: { source?: BeatTransportControlSource } = {},
  ) {
    if (options.source === "lifecycle" && id !== undefined) {
      const owner = getRhythmPlaybackOwner(this.rhythm.getSnapshot(), id);
      if (owner === "part-sequence") {
        return;
      }
    }

    this.notifyManualControl(
      { kind: "stop", target: "rhythm" },
      options.source,
    );
    this.revision += 1;
    this.rhythm.stop(id);
  }

  stopPartPlayback(owner: PlaybackOwner = "part-sequence") {
    this.revision += 1;
    this.exercise.getActiveIds(owner).forEach((id) => this.exercise.stop(id));
    this.rhythm.getActiveIds(owner).forEach((id) => this.rhythm.stop(id));
  }
}

export const beatTransportCoordinator = new BeatTransportCoordinator();
