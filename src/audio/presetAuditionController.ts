import { musoAudioEngine } from "./createWebAudioEngine";
import { audioPresets } from "./presets";
import {
  type AudioEngine,
  type AudioPresetId,
  type AudioUse,
  type AudioVoiceHandle,
  type PlaybackGroupHandle,
} from "./types";

const AUDITION_LOOKAHEAD_SECONDS = 0.02;
const AUDITION_END_FALLBACK_SECONDS = 1;

export interface PresetAuditionRequest {
  durationSeconds?: number;
  midiNote: number;
  presetId: AudioPresetId;
  use: AudioUse;
  velocity?: number;
}

export type PresetAuditionAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "scheduleNote"
  | "subscribeToStopAll"
  | "subscribeToVoiceEnd"
>;

interface ActiveAudition {
  group: PlaybackGroupHandle;
  revision: number;
  timeout: ReturnType<typeof globalThis.setTimeout>;
  unsubscribeFromVoiceEnd: () => void;
  voice: AudioVoiceHandle;
}

/**
 * Owns the single preset-preview channel used by sound choosers. A new choice
 * always replaces an earlier preview, including one that is still preparing.
 */
export class PresetAuditionController {
  private active: ActiveAudition | undefined;
  private revision = 0;
  private readonly unsubscribeFromStopAll: () => void;

  constructor(
    private readonly audioEngine: PresetAuditionAudioEngine = musoAudioEngine,
  ) {
    this.unsubscribeFromStopAll = this.audioEngine.subscribeToStopAll(() =>
      this.cancel(),
    );
  }

  private clearActive() {
    const active = this.active;
    this.active = undefined;

    if (!active) {
      return;
    }

    globalThis.clearTimeout(active.timeout);
    active.unsubscribeFromVoiceEnd();
    this.audioEngine.cancelPlaybackGroup(active.group);
  }

  private finish(revision: number, voice: AudioVoiceHandle) {
    if (this.active?.revision !== revision || this.active.voice !== voice) {
      return;
    }

    this.clearActive();
  }

  async audition(request: PresetAuditionRequest) {
    const revision = ++this.revision;
    this.clearActive();

    const prepared = await this.audioEngine.prime();
    const currentTime = this.audioEngine.getCurrentTime();

    if (!prepared || currentTime === undefined || revision !== this.revision) {
      return false;
    }

    const group = this.audioEngine.createPlaybackGroup();
    const voice = this.audioEngine.scheduleNote({
      ...(request.durationSeconds === undefined
        ? {}
        : { durationSeconds: request.durationSeconds }),
      group,
      midiNote: request.midiNote,
      presetId: request.presetId,
      startTime: currentTime + AUDITION_LOOKAHEAD_SECONDS,
      use: request.use,
      ...(request.velocity === undefined ? {} : { velocity: request.velocity }),
    });

    if (revision !== this.revision || voice === undefined) {
      this.audioEngine.cancelPlaybackGroup(group);
      return false;
    }

    const durationSeconds =
      request.durationSeconds ??
      audioPresets[request.presetId].defaultDurationSeconds;
    const active: ActiveAudition = {
      group,
      revision,
      timeout: globalThis.setTimeout(
        () => this.finish(revision, voice),
        (durationSeconds + AUDITION_END_FALLBACK_SECONDS) * 1000,
      ),
      unsubscribeFromVoiceEnd: () => undefined,
      voice,
    };

    this.active = active;
    active.unsubscribeFromVoiceEnd = this.audioEngine.subscribeToVoiceEnd(
      voice,
      () => this.finish(revision, voice),
    );
    return true;
  }

  cancel() {
    this.revision += 1;
    this.clearActive();
  }

  dispose() {
    this.cancel();
    this.unsubscribeFromStopAll();
  }
}

export const presetAuditionController = new PresetAuditionController();
