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
import { musoAudioEngine } from "./createWebAudioEngine";
import { AUDIO_PLAYBACK_START_LEAD_SECONDS } from "./audioTimingConfig";
import { type PlaybackGroupHandle } from "./types";

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
  countIn?: BeatTransportCountIn;
  exercises?: readonly ExercisePlaybackRequest[];
  handoff?: boolean;
  originTime?: number;
  preserveRhythms?: boolean;
  rhythms?: readonly RhythmPlaybackRequest[];
  source?: BeatTransportStartSource;
  stopMissing?: boolean;
  tempoBpm?: number;
}

export interface BeatTransportCountIn {
  durationBeats: number;
  pulses: number;
}

export interface CountInPlaybackAudioEngine {
  cancelPlaybackGroup: (group: PlaybackGroupHandle) => void;
  createPlaybackGroup: () => PlaybackGroupHandle;
  prime: () => Promise<boolean>;
  scheduleMetronomeClick: (request: {
    accent?: boolean;
    group: PlaybackGroupHandle;
    startTime: number;
  }) => boolean;
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
  const minimumStartTime = currentTime + AUDIO_PLAYBACK_START_LEAD_SECONDS;
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

function rhythmRequestsAreEquivalent(
  active: RhythmPlaybackRequest | undefined,
  expected: RhythmPlaybackRequest,
) {
  if (
    !active ||
    active.id !== expected.id ||
    normalizeTempo(active.tempoBpm) !== normalizeTempo(expected.tempoBpm)
  ) {
    return false;
  }

  const left = active.pattern;
  const right = expected.pattern;
  return (
    left.ppq === right.ppq &&
    left.cycleTicks === right.cycleTicks &&
    left.meter.beats === right.meter.beats &&
    left.meter.beatUnit === right.meter.beatUnit &&
    left.swing?.ratio === right.swing?.ratio &&
    left.swing?.unitTicks === right.swing?.unitTicks &&
    left.hits.length === right.hits.length &&
    left.hits.every((hit, index) => {
      const candidate = right.hits[index];
      return (
        candidate !== undefined &&
        hit.atTicks === candidate.atTicks &&
        hit.sampleId === candidate.sampleId &&
        hit.velocity === candidate.velocity
      );
    })
  );
}

export class BeatTransportCoordinator {
  private countInGroup: PlaybackGroupHandle | undefined;
  private manualControlListeners = new Set<
    (event: BeatTransportManualControlEvent) => void
  >();
  private revision = 0;

  constructor(
    private readonly exercise: ExercisePlaybackCoordinator = exercisePlaybackCoordinator,
    private readonly rhythm: RhythmPlaybackCoordinator = rhythmPlaybackCoordinator,
    private readonly countInAudio: CountInPlaybackAudioEngine = musoAudioEngine,
  ) {}

  private stopCountIn() {
    if (!this.countInGroup) {
      return;
    }

    this.countInAudio.cancelPlaybackGroup(this.countInGroup);
    this.countInGroup = undefined;
  }

  private scheduleCountIn({
    countIn,
    originTime,
    secondsPerBeat,
  }: {
    countIn: BeatTransportCountIn;
    originTime: number;
    secondsPerBeat: number;
  }) {
    this.stopCountIn();
    const group = this.countInAudio.createPlaybackGroup();
    const startTime = originTime - countIn.durationBeats * secondsPerBeat;
    const pulseSeconds =
      (countIn.durationBeats * secondsPerBeat) / countIn.pulses;
    this.countInGroup = group;

    for (let pulse = 0; pulse < countIn.pulses; pulse += 1) {
      this.countInAudio.scheduleMetronomeClick({
        accent: pulse === 0,
        group,
        startTime: startTime + pulse * pulseSeconds,
      });
    }
  }

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
    countIn,
    exercises = [],
    handoff = false,
    originTime,
    preserveRhythms = false,
    rhythms = [],
    source = "manual",
    stopMissing = true,
    tempoBpm: requestedTempoBpm,
  }: BeatTransportPartStartRequest) {
    this.notifyManualControl({ kind: "start", target: "exercise" }, source);
    const revision = ++this.revision;
    const owner = getPlaybackOwnerForSource(source);
    const selectedExercises = exercises.slice(0, 1);
    const selectedRhythms = rhythms.slice(0, 1);
    const activeRhythmIds = new Set(this.rhythm.getActiveIds(owner));
    const canPreserveRhythmsAtRequestedOrigin =
      preserveRhythms &&
      selectedRhythms.length > 0 &&
      selectedRhythms.every(
        (request) =>
          activeRhythmIds.has(request.id) &&
          rhythmRequestsAreEquivalent(
            this.rhythm.getActiveRequest(request.id),
            request,
          ),
      );
    const rhythmsInitiallyRequiringStart = canPreserveRhythmsAtRequestedOrigin
      ? []
      : selectedRhythms;
    const resolvedCountIn =
      handoff || !countIn || countIn.durationBeats <= 0 || countIn.pulses <= 0
        ? undefined
        : {
            durationBeats: countIn.durationBeats,
            pulses: Math.round(countIn.pulses),
          };
    const preparesFreshOrigin =
      originTime === undefined &&
      (selectedExercises.length > 0 ||
        rhythmsInitiallyRequiringStart.length > 0 ||
        resolvedCountIn !== undefined);

    if (preparesFreshOrigin) {
      const prepared = await Promise.all([
        selectedExercises.length > 0
          ? this.exercise.prepare()
          : Promise.resolve(true),
        rhythmsInitiallyRequiringStart.length > 0
          ? this.rhythm.prepare()
          : Promise.resolve(true),
        resolvedCountIn ? this.countInAudio.prime() : Promise.resolve(true),
      ]);
      if (revision !== this.revision || prepared.some((ready) => !ready)) {
        return { originTime: undefined, started: false };
      }
    }

    const currentTime = this.getCurrentTime();
    const tempoBpm =
      getTempoBpm(selectedExercises, selectedRhythms) ?? requestedTempoBpm;
    const secondsPerBeat = tempoBpm ? 60 / normalizeTempo(tempoBpm) : undefined;
    const requestedOrigin =
      originTime ??
      (currentTime === undefined
        ? undefined
        : currentTime +
          AUDIO_PLAYBACK_START_LEAD_SECONDS +
          (resolvedCountIn?.durationBeats ?? 0) * (secondsPerBeat ?? 0));
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
    const originWasRebased =
      requestedOrigin !== undefined &&
      resolvedOriginTime !== undefined &&
      resolvedOriginTime > requestedOrigin + BEAT_GRID_EPSILON;
    // A preserved Rhythm must never remain on the former bar phase while a
    // late Part handoff is moved to a new beat. Restart both lanes together as
    // a final safety net; the sequence coordinator normally avoids this by
    // selecting a future boundary on its absolute timeline.
    const canPreserveRhythms =
      canPreserveRhythmsAtRequestedOrigin && !originWasRebased;
    const rhythmsToStart = canPreserveRhythms ? [] : selectedRhythms;

    if (
      resolvedCountIn &&
      resolvedOriginTime !== undefined &&
      secondsPerBeat !== undefined
    ) {
      this.scheduleCountIn({
        countIn: resolvedCountIn,
        originTime: resolvedOriginTime,
        secondsPerBeat,
      });
    } else if (!handoff) {
      this.stopCountIn();
    }

    if (stopMissing) {
      this.exercise
        .getActiveIds(owner)
        .forEach((id) =>
          this.exercise.stop(id, { atTime: resolvedOriginTime }),
        );
      if (!canPreserveRhythms) {
        this.rhythm
          .getActiveIds(owner)
          .forEach((id) =>
            this.rhythm.stop(id, { atTime: resolvedOriginTime }),
          );
      }
    }

    const results = await Promise.all([
      ...selectedExercises.map((request) =>
        this.exercise.start(request, {
          handoff,
          owner,
          originTime: resolvedOriginTime,
          prepared: preparesFreshOrigin,
        }),
      ),
      ...rhythmsToStart.map((request) =>
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
      started: revision === this.revision && results.every(Boolean),
    };
  }

  updatePartLive({
    exercises = [],
    rhythms = [],
  }: Pick<BeatTransportPartStartRequest, "exercises" | "rhythms">) {
    const exercise = exercises[0];
    const rhythm = rhythms[0];
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
    this.stopCountIn();
    this.exercise.getActiveIds(owner).forEach((id) => this.exercise.stop(id));
    this.rhythm.getActiveIds(owner).forEach((id) => this.rhythm.stop(id));
  }
}

export const beatTransportCoordinator = new BeatTransportCoordinator();
