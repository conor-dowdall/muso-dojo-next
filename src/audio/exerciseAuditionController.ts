import { musoAudioEngine } from "./createWebAudioEngine";
import {
  type AudioEngine,
  type AudioPresetId,
  type AudioVoiceHandle,
  type PlaybackGroupHandle,
} from "./types";

const AUDITION_LOOKAHEAD_SECONDS = 0.02;
const AUDITION_END_FALLBACK_SECONDS = 1;
const EMPTY_ACTIVE_KEYS: ReadonlySet<string> = new Set();

export interface ExerciseAuditionNote {
  key?: string;
  midi: number;
}

export interface ExerciseAuditionRequest {
  durationSeconds: number;
  notes: readonly ExerciseAuditionNote[];
  presetId: AudioPresetId;
  velocity: number;
}

export type ExerciseAuditionAudioEngine = Pick<
  AudioEngine,
  | "cancelPlaybackGroup"
  | "createPlaybackGroup"
  | "getCurrentTime"
  | "prime"
  | "scheduleNote"
  | "subscribeToVoiceEnd"
>;

interface ActiveAudition {
  group: PlaybackGroupHandle;
  keyByHandle: Map<AudioVoiceHandle, string>;
  remainingHandles: Set<AudioVoiceHandle>;
  revision: number;
  timeout: ReturnType<typeof setTimeout>;
  unsubscribers: Map<AudioVoiceHandle, () => void>;
}

function getVisibleAuditionKeys(notes: readonly ExerciseAuditionNote[]) {
  return new Set(
    notes.flatMap((note) => (note.key === undefined ? [] : [note.key])),
  );
}

export class ExerciseAuditionController {
  private active: ActiveAudition | undefined;
  private listeners = new Set<() => void>();
  private revision = 0;
  private snapshot = EMPTY_ACTIVE_KEYS;

  constructor(
    private readonly audioEngine: ExerciseAuditionAudioEngine = musoAudioEngine,
  ) {}

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private setActiveKeys(keys: ReadonlySet<string>) {
    if (
      keys.size === this.snapshot.size &&
      [...keys].every((key) => this.snapshot.has(key))
    ) {
      return;
    }

    this.snapshot = keys.size === 0 ? EMPTY_ACTIVE_KEYS : new Set(keys);
    this.emit();
  }

  private clearActive(
    nextVisibleKeys: ReadonlySet<string> = EMPTY_ACTIVE_KEYS,
  ) {
    const active = this.active;
    this.active = undefined;

    if (active) {
      clearTimeout(active.timeout);
      active.unsubscribers.forEach((unsubscribe) => unsubscribe());
      this.audioEngine.cancelPlaybackGroup(active.group);
    }

    this.setActiveKeys(nextVisibleKeys);
  }

  private finishVoice(
    revision: number,
    group: PlaybackGroupHandle,
    handle: AudioVoiceHandle,
  ) {
    const active = this.active;

    if (
      active?.revision !== revision ||
      active.group !== group ||
      !active.remainingHandles.delete(handle)
    ) {
      return;
    }

    active.unsubscribers.get(handle)?.();
    active.unsubscribers.delete(handle);
    const key = active.keyByHandle.get(handle);

    if (key !== undefined) {
      const nextKeys = new Set(this.snapshot);
      nextKeys.delete(key);
      this.setActiveKeys(nextKeys);
    }

    if (active.remainingHandles.size === 0) {
      this.clearActive();
    }
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async audition(request: ExerciseAuditionRequest) {
    const revision = ++this.revision;

    if (request.notes.length === 0 || request.durationSeconds <= 0) {
      this.clearActive();
      return false;
    }

    const visibleKeys = getVisibleAuditionKeys(request.notes);
    this.clearActive(visibleKeys);

    const prepared = await this.audioEngine.prime();
    const currentTime = this.audioEngine.getCurrentTime();

    if (!prepared || currentTime === undefined || revision !== this.revision) {
      if (revision === this.revision) {
        this.setActiveKeys(EMPTY_ACTIVE_KEYS);
      }
      return false;
    }

    const group = this.audioEngine.createPlaybackGroup();
    const startTime = currentTime + AUDITION_LOOKAHEAD_SECONDS;
    const scheduled = request.notes.flatMap((note) => {
      const handle = this.audioEngine.scheduleNote({
        durationSeconds: request.durationSeconds,
        group,
        midiNote: note.midi,
        presetId: request.presetId,
        startTime,
        use: "exercise",
        velocity: request.velocity,
      });

      return handle === undefined ? [] : [{ handle, key: note.key }];
    });

    if (revision !== this.revision || scheduled.length === 0) {
      this.audioEngine.cancelPlaybackGroup(group);
      if (revision === this.revision) {
        this.setActiveKeys(EMPTY_ACTIVE_KEYS);
      }
      return false;
    }

    const active: ActiveAudition = {
      group,
      keyByHandle: new Map(
        scheduled.flatMap(({ handle, key }) =>
          key === undefined ? [] : [[handle, key] as const],
        ),
      ),
      remainingHandles: new Set(scheduled.map(({ handle }) => handle)),
      revision,
      timeout: setTimeout(
        () => {
          if (this.active?.revision === revision) {
            this.clearActive();
          }
        },
        (request.durationSeconds + AUDITION_END_FALLBACK_SECONDS) * 1000,
      ),
      unsubscribers: new Map(),
    };

    this.active = active;
    scheduled.forEach(({ handle }) => {
      active.unsubscribers.set(
        handle,
        this.audioEngine.subscribeToVoiceEnd(handle, () =>
          this.finishVoice(revision, group, handle),
        ),
      );
    });
    this.setActiveKeys(
      new Set(scheduled.flatMap(({ key }) => (key === undefined ? [] : [key]))),
    );
    return true;
  }

  cancel() {
    this.revision += 1;
    this.clearActive();
  }

  dispose() {
    this.cancel();
    this.listeners.clear();
  }
}
