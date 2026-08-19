import { AUDIO_PLAYBACK_START_LEAD_SECONDS } from "./audioTimingConfig";
import { musoAudioEngine } from "./createWebAudioEngine";
import { type PlaybackOwner } from "./playbackOwnership";
import {
  type AudioEngine,
  type AudioPresetId,
  type PlaybackGroupHandle,
} from "./types";

const ENDING_PERCUSSION_PLAYBACK_GAIN = 1.18;

export interface EndingPlaybackRequest {
  crashVelocity: number;
  durationBeats: number;
  fadeSeconds: number;
  kickVelocity: number;
  midi: number;
  noteVelocity: number;
  presetId: AudioPresetId;
  tempoBpm: number;
}

export interface EndingPlaybackStartOptions {
  originTime?: number;
  owner?: PlaybackOwner;
  prepared?: boolean;
  replacementTime?: number;
}

export type EndingPlaybackAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "scheduleNote"
  | "schedulePercussionHit"
>;

interface ActiveEndingPlayback {
  group: PlaybackGroupHandle;
  owner: PlaybackOwner;
  stopTimer?: ReturnType<typeof globalThis.setTimeout>;
}

function normalizeTempo(tempoBpm: number) {
  return Math.min(300, Math.max(30, Math.round(tempoBpm)));
}

function getEndingDurationSeconds(request: EndingPlaybackRequest) {
  return (
    request.durationBeats * (60 / normalizeTempo(request.tempoBpm)) +
    request.fadeSeconds
  );
}

export class EndingPlaybackCoordinator {
  private active: ActiveEndingPlayback | undefined;
  private revision = 0;

  constructor(
    private readonly audioEngine: EndingPlaybackAudioEngine = musoAudioEngine,
  ) {}

  getActiveOwner() {
    return this.active?.owner;
  }

  prepare = () => this.audioEngine.prime();

  private clearStopTimer(playback: ActiveEndingPlayback) {
    if (playback.stopTimer !== undefined) {
      globalThis.clearTimeout(playback.stopTimer);
      playback.stopTimer = undefined;
    }
  }

  private finishPlayback(playback: ActiveEndingPlayback) {
    this.clearStopTimer(playback);
    if (this.active === playback) {
      this.active = undefined;
    }
  }

  private stopPlayback(
    playback: ActiveEndingPlayback,
    options?: {
      atTime?: number;
      releaseSeconds?: number;
      retainActiveThroughRelease?: boolean;
    },
  ) {
    this.clearStopTimer(playback);
    const audioStopOptions = options
      ? {
          ...(options.atTime === undefined ? {} : { atTime: options.atTime }),
          ...(options.releaseSeconds === undefined
            ? {}
            : { releaseSeconds: options.releaseSeconds }),
        }
      : undefined;
    this.audioEngine.cancelPlaybackGroup(playback.group, audioStopOptions);

    const currentTime = this.audioEngine.getCurrentTime();
    if (options?.atTime !== undefined && currentTime !== undefined) {
      const releaseSeconds = options.retainActiveThroughRelease
        ? Math.max(0, options.releaseSeconds ?? 0)
        : 0;
      const remainingSeconds =
        Math.max(0, options.atTime - currentTime) + releaseSeconds;
      if (remainingSeconds > 0) {
        playback.stopTimer = globalThis.setTimeout(
          () => this.finishPlayback(playback),
          remainingSeconds * 1000,
        );
        return;
      }
    }

    this.finishPlayback(playback);
  }

  async start(
    request: EndingPlaybackRequest,
    options: EndingPlaybackStartOptions = {},
  ) {
    const revision = ++this.revision;
    let prepared = options.prepared === true;

    if (!prepared) {
      try {
        prepared = await this.audioEngine.prime();
      } catch {
        prepared = false;
      }
    }

    const currentTime = this.audioEngine.getCurrentTime();
    if (!prepared || currentTime === undefined || revision !== this.revision) {
      return false;
    }

    const originTime =
      options.originTime ?? currentTime + AUDIO_PLAYBACK_START_LEAD_SECONDS;
    const replacementTime = options.replacementTime ?? originTime;
    const previous = this.active;
    if (previous) {
      this.stopPlayback(
        previous,
        replacementTime > currentTime ? { atTime: replacementTime } : undefined,
      );
    }

    const group = this.audioEngine.createPlaybackGroup();
    const note = this.audioEngine.scheduleNote({
      durationSeconds: getEndingDurationSeconds(request),
      group,
      midiNote: request.midi,
      presetId: request.presetId,
      startTime: originTime,
      use: "exercise",
      velocity: request.noteVelocity,
    });
    const kick = this.audioEngine.schedulePercussionHit({
      group,
      sampleId: "kick",
      startTime: originTime,
      velocity: request.kickVelocity * ENDING_PERCUSSION_PLAYBACK_GAIN,
    });
    const crash = this.audioEngine.schedulePercussionHit({
      group,
      sampleId: "crash",
      startTime: originTime,
      velocity: request.crashVelocity * ENDING_PERCUSSION_PLAYBACK_GAIN,
    });

    if (!note || !kick || !crash || revision !== this.revision) {
      this.audioEngine.cancelPlaybackGroup(group);
      return false;
    }

    this.active = {
      group,
      owner: options.owner ?? "manual",
    };
    return true;
  }

  stop(
    owner?: PlaybackOwner,
    options?: {
      atTime?: number;
      releaseSeconds?: number;
      retainActiveThroughRelease?: boolean;
    },
  ) {
    this.revision += 1;
    const playback = this.active;
    if (playback && (owner === undefined || playback.owner === owner)) {
      this.stopPlayback(playback, options);
    }
  }
}
