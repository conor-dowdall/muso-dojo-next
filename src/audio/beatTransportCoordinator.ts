import {
  exercisePlaybackCoordinator,
  type ExercisePlaybackCoordinator,
  type ExercisePlaybackRequest,
  type ExercisePlaybackSnapshot,
} from "./exercisePlaybackCoordinator";
import {
  rhythmPlaybackCoordinator,
  type RhythmPlaybackCoordinator,
  type RhythmPlaybackRequest,
  type RhythmPlaybackSnapshot,
} from "./rhythmPlaybackCoordinator";

const TRANSPORT_HANDOFF_LEAD_SECONDS = 0.08;
const BEAT_GRID_EPSILON = 1e-6;

interface BeatGrid {
  originTime: number;
  secondsPerBeat: number;
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
  private pendingCompanionStart:
    | { revision: number; target: "exercise" | "rhythm" }
    | undefined;
  private revision = 0;

  constructor(
    private readonly exercise: ExercisePlaybackCoordinator = exercisePlaybackCoordinator,
    private readonly rhythm: RhythmPlaybackCoordinator = rhythmPlaybackCoordinator,
  ) {}

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

  async startExercise(request: ExercisePlaybackRequest) {
    const revision = ++this.revision;
    const exerciseSnapshot = this.exercise.getSnapshot();
    const currentTime =
      this.exercise.getCurrentTime() ?? this.rhythm.getCurrentTime();
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
        },
      );
      this.clearPendingCompanionStart(revision, "rhythm");
    }

    return true;
  }

  async startRhythm(request: RhythmPlaybackRequest) {
    const revision = ++this.revision;
    const rhythmSnapshot = this.rhythm.getSnapshot();
    const currentTime =
      this.rhythm.getCurrentTime() ?? this.exercise.getCurrentTime();
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
        { handoff: this.exercise.getSnapshot().playing, originTime },
      );
      this.clearPendingCompanionStart(revision, "exercise");
    }

    return true;
  }

  stopExercise(id?: string) {
    this.revision += 1;
    this.cancelPendingCompanionStart("rhythm");
    this.exercise.stop(id);
  }

  stopRhythm(id?: string) {
    this.revision += 1;
    this.cancelPendingCompanionStart("exercise");
    this.rhythm.stop(id);
  }
}

export const beatTransportCoordinator = new BeatTransportCoordinator();
