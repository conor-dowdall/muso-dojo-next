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

const TRANSPORT_HANDOFF_LEAD_SECONDS = 0.08;
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
  exercise?: ExercisePlaybackRequest;
  handoff?: boolean;
  originTime?: number;
  rhythm?: RhythmPlaybackRequest;
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
  const minimumStartTime = currentTime + TRANSPORT_HANDOFF_LEAD_SECONDS;

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

function getExerciseBeatGrid(
  snapshot: ExercisePlaybackSnapshot,
): BeatGrid | undefined {
  if (
    !snapshot.playing ||
    snapshot.originTime === undefined ||
    snapshot.secondsPerBeat === undefined
  ) {
    return undefined;
  }

  return {
    originTime: snapshot.originTime,
    secondsPerBeat: snapshot.secondsPerBeat,
  };
}

function getRhythmBeatGrid(
  snapshot: RhythmPlaybackSnapshot,
): BeatGrid | undefined {
  if (
    !snapshot.playing ||
    snapshot.originTime === undefined ||
    snapshot.tempoBpm === undefined
  ) {
    return undefined;
  }

  return {
    originTime: snapshot.originTime,
    secondsPerBeat: 60 / normalizeTempo(snapshot.tempoBpm),
  };
}

function getStartedOriginTime({
  fallbackOriginTime,
  pendingId,
  snapshot,
}: {
  fallbackOriginTime?: number;
  pendingId: string;
  snapshot: ExercisePlaybackSnapshot | RhythmPlaybackSnapshot;
}) {
  return snapshot.pendingId === pendingId
    ? snapshot.pendingOriginTime
    : (snapshot.originTime ?? fallbackOriginTime);
}

export class BeatTransportCoordinator {
  private manualControlListeners = new Set<
    (event: BeatTransportManualControlEvent) => void
  >();
  private pendingCompanionStart:
    { revision: number; target: "exercise" | "rhythm" } | undefined;
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

  subscribeToManualStart = (listener: () => void) => {
    return this.subscribeToManualControl((event) => {
      if (event.kind === "start") {
        listener();
      }
    });
  };

  getCurrentTime = () =>
    this.exercise.getCurrentTime() ?? this.rhythm.getCurrentTime();

  private cancelPendingCompanionStart(target?: "exercise" | "rhythm") {
    if (
      !this.pendingCompanionStart ||
      (target && this.pendingCompanionStart.target !== target)
    ) {
      return;
    }

    if (this.pendingCompanionStart.target === "exercise") {
      this.exercise.cancelPendingStart();
    } else {
      this.rhythm.cancelPendingStart();
    }

    this.pendingCompanionStart = undefined;
  }

  private clearPendingCompanionStart(
    revision: number,
    target: "exercise" | "rhythm",
  ) {
    if (
      this.pendingCompanionStart?.revision === revision &&
      this.pendingCompanionStart.target === target
    ) {
      this.pendingCompanionStart = undefined;
    }
  }

  async startExercise(
    request: ExercisePlaybackRequest,
    options: { source?: BeatTransportStartSource } = {},
  ) {
    const owner = getPlaybackOwnerForSource(options.source);

    this.notifyManualControl(
      { kind: "start", target: "exercise" },
      options.source,
    );
    const revision = ++this.revision;
    const exerciseSnapshot = this.exercise.getSnapshot();
    const currentTime = this.getCurrentTime();
    const sameExerciseIsPlaying =
      exerciseSnapshot.playing && exerciseSnapshot.activeId === request.id;
    const launchGrid =
      request.countInBeats === 0 && !sameExerciseIsPlaying
        ? getExerciseBeatGrid(exerciseSnapshot)
        : undefined;
    const launchOriginTime =
      currentTime !== undefined && launchGrid
        ? getNextBeatOrigin({ currentTime, grid: launchGrid })
        : undefined;

    this.cancelPendingCompanionStart();
    this.rhythm.cancelPendingStart();

    const started = await this.exercise.start(request, {
      ...(launchOriginTime === undefined
        ? {}
        : {
            handoff: exerciseSnapshot.playing,
            originTime: launchOriginTime,
          }),
      owner,
    });

    if (!started || revision !== this.revision) {
      return false;
    }

    const originTime = getStartedOriginTime({
      fallbackOriginTime: launchOriginTime,
      pendingId: request.id,
      snapshot: this.exercise.getSnapshot(),
    });
    const rhythmRequest = this.rhythm.getActiveRequest();

    if (originTime !== undefined && rhythmRequest) {
      this.pendingCompanionStart = { revision, target: "rhythm" };
      await this.rhythm.start(
        {
          ...rhythmRequest,
          tempoBpm: request.tempoBpm,
        },
        {
          handoff:
            request.countInBeats === 0 && this.rhythm.getSnapshot().playing,
          originTime,
          owner,
        },
      );
      this.clearPendingCompanionStart(revision, "rhythm");
    }

    return true;
  }

  async startRhythm(
    request: RhythmPlaybackRequest,
    options: { source?: BeatTransportStartSource } = {},
  ) {
    const owner = getPlaybackOwnerForSource(options.source);

    this.notifyManualControl(
      { kind: "start", target: "rhythm" },
      options.source,
    );
    const revision = ++this.revision;
    const rhythmSnapshot = this.rhythm.getSnapshot();
    const currentTime = this.getCurrentTime();
    const sameRhythmIsPlaying =
      rhythmSnapshot.playing && rhythmSnapshot.activeId === request.id;
    const launchGrid = !sameRhythmIsPlaying
      ? getRhythmBeatGrid(rhythmSnapshot)
      : undefined;
    const launchOriginTime =
      currentTime !== undefined && launchGrid
        ? getNextBeatOrigin({ currentTime, grid: launchGrid })
        : undefined;

    this.cancelPendingCompanionStart();
    this.exercise.cancelPendingStart();

    const started = await this.rhythm.start(request, {
      ...(launchOriginTime === undefined
        ? {}
        : {
            handoff: rhythmSnapshot.playing,
            originTime: launchOriginTime,
          }),
      owner,
    });

    if (!started || revision !== this.revision) {
      return false;
    }

    const originTime = getStartedOriginTime({
      fallbackOriginTime: launchOriginTime,
      pendingId: request.id,
      snapshot: this.rhythm.getSnapshot(),
    });
    const exerciseRequest = this.exercise.getActiveRequest();

    if (originTime !== undefined && exerciseRequest) {
      this.pendingCompanionStart = { revision, target: "exercise" };
      await this.exercise.start(
        {
          ...exerciseRequest,
          countInBeats: 0,
          tempoBpm: request.tempoBpm,
        },
        { handoff: this.exercise.getSnapshot().playing, originTime, owner },
      );
      this.clearPendingCompanionStart(revision, "exercise");
    }

    return true;
  }

  async startPart({
    exercise,
    handoff = false,
    originTime,
    rhythm,
    source = "manual",
    stopMissing = true,
  }: BeatTransportPartStartRequest) {
    const owner = getPlaybackOwnerForSource(source);

    this.notifyManualControl({ kind: "start", target: "exercise" }, source);
    const revision = ++this.revision;
    const currentTime = this.getCurrentTime();
    const resolvedOriginTime =
      originTime ??
      (currentTime === undefined
        ? undefined
        : currentTime + TRANSPORT_HANDOFF_LEAD_SECONDS);

    this.cancelPendingCompanionStart();

    if (exercise) {
      this.exercise.cancelPendingStart();
    } else if (stopMissing) {
      this.exercise.cancelPendingStart();
      this.exercise.stop(undefined, {
        atTime: resolvedOriginTime,
      });
    }

    if (rhythm) {
      this.rhythm.cancelPendingStart();
    } else if (stopMissing) {
      this.rhythm.cancelPendingStart();
      this.rhythm.stop(undefined, {
        atTime: resolvedOriginTime,
      });
    }

    if (resolvedOriginTime === undefined && exercise && rhythm) {
      const exerciseStarted = await this.exercise.start(exercise, {
        handoff,
        owner,
      });
      const startedOriginTime =
        this.exercise.getSnapshot().originTime ??
        this.exercise.getSnapshot().pendingOriginTime;
      const rhythmStarted =
        startedOriginTime === undefined
          ? false
          : await this.rhythm.start(rhythm, {
              handoff,
              originTime: startedOriginTime,
              owner,
            });

      if (revision !== this.revision) {
        return { originTime: startedOriginTime, started: false };
      }

      return {
        originTime: startedOriginTime,
        started: exerciseStarted !== false && rhythmStarted !== false,
      };
    }

    const [exerciseStarted, rhythmStarted] = await Promise.all([
      exercise
        ? this.exercise.start(exercise, {
            handoff,
            owner,
            originTime: resolvedOriginTime,
          })
        : Promise.resolve(undefined),
      rhythm
        ? this.rhythm.start(rhythm, {
            handoff,
            owner,
            originTime: resolvedOriginTime,
          })
        : Promise.resolve(undefined),
    ]);

    if (revision !== this.revision) {
      return { originTime: resolvedOriginTime, started: false };
    }

    return {
      originTime: resolvedOriginTime,
      started: exerciseStarted !== false && rhythmStarted !== false,
    };
  }

  updatePartLive({
    exercise,
    rhythm,
  }: Pick<BeatTransportPartStartRequest, "exercise" | "rhythm">) {
    if (exercise) {
      this.exercise.setMetronomeEnabled(exercise.id, exercise.metronomeEnabled);
    }

    if (rhythm) {
      this.rhythm.setPattern(rhythm.id, rhythm.pattern);
    }
  }

  stopExercise(
    id?: string,
    options: { source?: BeatTransportControlSource } = {},
  ) {
    if (options.source === "lifecycle") {
      if (id === undefined) {
        return;
      }

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
    this.cancelPendingCompanionStart("rhythm");
    this.exercise.stop(id);
  }

  stopRhythm(
    id?: string,
    options: { source?: BeatTransportControlSource } = {},
  ) {
    if (options.source === "lifecycle") {
      if (id === undefined) {
        return;
      }

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
    this.cancelPendingCompanionStart("exercise");
    this.rhythm.stop(id);
  }

  stopPartPlayback() {
    this.revision += 1;
    this.cancelPendingCompanionStart();
    this.exercise.stop();
    this.rhythm.stop();
  }
}

export const beatTransportCoordinator = new BeatTransportCoordinator();
