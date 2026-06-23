import {
  getAudioContextConstructor,
  getOfflineAudioContextConstructor,
} from "./audioContext";
import { scheduleMetronomeClick } from "./metronome";
import { PERCUSSION_SAMPLE_PACK_ID, schedulePercussionHit } from "./percussion";
import { getDefaultAudioPresetId, resolveAudioPreset } from "./presets";
import { isPlayableMidiNote } from "./pitch";
import {
  createSamplePackLoader,
  getConcertPitchHz,
  SAMPLE_PACK_IDS,
} from "./samplePackLibrary";
import {
  createDroneVoice,
  createSampleVoice,
  DEFAULT_DRONE_RELEASE_SECONDS,
  stopDroneVoice,
  type ActiveDroneVoice,
  type ActiveSampleVoice,
} from "./samplePlayback";
import {
  type AudioClockSnapshot,
  type AudioEngine,
  type AudioPreset,
  type AudioUse,
  type AudioVoiceHandle,
  type DroneHandle,
  type DroneRequest,
  type PlaybackGroupHandle,
  type PlayNoteRequest,
  type SamplePackId,
  type ScheduleMetronomeClickRequest,
  type ScheduleNoteRequest,
  type SchedulePercussionHitRequest,
} from "./types";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const GROUP_CANCEL_RELEASE_SECONDS = 0.03;

interface PlaybackGroup {
  cancelAtTime?: number;
  cancelTimer?: ReturnType<typeof globalThis.setTimeout>;
  hits: Set<ScheduledHit>;
  releaseSeconds?: number;
  voices: Set<AudioVoiceHandle>;
}

interface ScheduledHit {
  disconnect: () => void;
  stop: (atTime?: number) => void;
}

interface ActiveVoice extends ActiveSampleVoice {
  group?: PlaybackGroupHandle;
}

interface ActiveDrone {
  concertPitchHz: number;
  context: AudioContext;
  notes: Map<string, ActiveDroneVoice>;
  packId: SamplePackId;
  preset: AudioPreset;
}

function createPlaybackGroupHandle(index: number) {
  return `playback-group-${index}` as PlaybackGroupHandle;
}

function createVoiceHandle(index: number) {
  return `audio-voice-${index}` as AudioVoiceHandle;
}

function createDroneHandle(index: number) {
  return `drone-${index}` as DroneHandle;
}

function getNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function getPresetForRequest({
  presetId,
  use = DEFAULT_AUDIO_USE,
}: Pick<PlayNoteRequest, "presetId" | "use">) {
  return resolveAudioPreset(presetId, getDefaultAudioPresetId(use));
}

function stopDrone(
  drone: ActiveDrone,
  releaseSeconds = DEFAULT_DRONE_RELEASE_SECONDS,
) {
  drone.notes.forEach((voice) =>
    stopDroneVoice(voice, drone.context, releaseSeconds),
  );
  drone.notes.clear();
}

export function createWebAudioEngine(): AudioEngine {
  const stopAllListeners = new Set<() => void>();
  const playbackGroups = new Map<PlaybackGroupHandle, PlaybackGroup>();
  const activeVoices = new Map<AudioVoiceHandle, ActiveVoice>();
  const voiceEndListeners = new Map<AudioVoiceHandle, Set<() => void>>();
  const endedVoices = new Set<AudioVoiceHandle>();
  const activeDrones = new Map<DroneHandle, ActiveDrone>();
  const samplePackLoader = createSamplePackLoader();
  let context: AudioContext | undefined;
  let nextGroupId = 0;
  let nextVoiceId = 0;
  let nextDroneId = 0;

  const getAudioContext = async ({ resume }: { resume: boolean }) => {
    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return undefined;
    }

    if (!context || context.state === "closed") {
      try {
        context = new AudioContextConstructor({ latencyHint: "interactive" });
      } catch {
        return undefined;
      }
    }

    if (resume && context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return undefined;
      }
    }

    return context.state === "closed" ? undefined : context;
  };

  const getReadyAudioContext = () => getAudioContext({ resume: true });

  const getWarmAudioContext = async () => {
    const OfflineAudioContextConstructor = getOfflineAudioContextConstructor();

    if (OfflineAudioContextConstructor) {
      try {
        return new OfflineAudioContextConstructor({
          length: 1,
          numberOfChannels: 1,
          sampleRate: 48_000,
        });
      } catch {
        try {
          return new OfflineAudioContextConstructor(1, 1, 48_000);
        } catch {
          // Fall back to a suspended live context below.
        }
      }
    }

    return getAudioContext({ resume: false });
  };

  const loadAllSamplePacks = async (audioContext: BaseAudioContext) => {
    const packs = await Promise.all(
      SAMPLE_PACK_IDS.map((packId) =>
        samplePackLoader.loadSamplePack(audioContext, packId),
      ),
    );

    return packs.every(Boolean);
  };

  const emitVoiceEnd = (handle: AudioVoiceHandle) => {
    endedVoices.add(handle);
    const listeners = voiceEndListeners.get(handle);

    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => listener());
    voiceEndListeners.delete(handle);
  };

  const finishVoice = (handle: AudioVoiceHandle) => {
    const activeVoice = activeVoices.get(handle);

    if (!activeVoice) {
      return;
    }

    activeVoices.delete(handle);
    if (activeVoice.group) {
      playbackGroups.get(activeVoice.group)?.voices.delete(handle);
    }

    activeVoice.disconnect();
    emitVoiceEnd(handle);
  };

  const stopVoice = (
    handle: AudioVoiceHandle,
    releaseSeconds = GROUP_CANCEL_RELEASE_SECONDS,
    atTime?: number,
  ) => {
    activeVoices.get(handle)?.stop(releaseSeconds, atTime);
  };

  const clearPlaybackGroupCancelTimer = (group: PlaybackGroup) => {
    if (group.cancelTimer === undefined) {
      return;
    }

    globalThis.clearTimeout(group.cancelTimer);
    group.cancelTimer = undefined;
  };

  const deletePlaybackGroup = (handle: PlaybackGroupHandle) => {
    const group = playbackGroups.get(handle);

    if (!group) {
      return;
    }

    clearPlaybackGroupCancelTimer(group);
    playbackGroups.delete(handle);
  };

  const applyScheduledGroupCancelToVoice = (
    group: PlaybackGroup,
    voiceHandle: AudioVoiceHandle,
  ) => {
    if (group.cancelAtTime === undefined) {
      return;
    }

    stopVoice(voiceHandle, group.releaseSeconds, group.cancelAtTime);
  };

  const applyScheduledGroupCancelToHit = (
    group: PlaybackGroup,
    hit: ScheduledHit,
  ) => {
    if (group.cancelAtTime === undefined) {
      return;
    }

    hit.stop(group.cancelAtTime);
  };

  const createManagedSampleVoice = ({
    audioContext,
    durationSeconds,
    group,
    midiNote,
    preset,
    startTime,
    use,
    velocity,
    concertPitchHz,
  }: {
    audioContext: AudioContext;
    concertPitchHz?: number;
    durationSeconds?: number;
    group?: PlaybackGroupHandle;
    midiNote: number;
    preset: AudioPreset;
    startTime: number;
    use?: AudioUse;
    velocity?: number;
  }) => {
    const loaded = samplePackLoader.getLoadedSamplePack(preset.samplePackId);

    if (!loaded) {
      void samplePackLoader.loadSamplePack(audioContext, preset.samplePackId);
      return undefined;
    }

    const handle = createVoiceHandle((nextVoiceId += 1));
    const voice = createSampleVoice({
      buffer: loaded.buffer,
      concertPitchHz,
      context: audioContext,
      durationSeconds,
      midiNote,
      onEnded: () => finishVoice(handle),
      pack: loaded.pack,
      preset,
      startTime,
      use,
      velocity,
    });

    if (!voice) {
      return undefined;
    }

    activeVoices.set(handle, {
      ...voice,
      group,
    });
    if (group) {
      playbackGroups.get(group)?.voices.add(handle);
    }

    return handle;
  };

  return {
    cancelPlaybackGroup: (handle, options) => {
      const group = playbackGroups.get(handle);

      if (!group) {
        return;
      }

      const cancelAtTime = options?.atTime;
      const releaseSeconds = options?.releaseSeconds;

      if (
        cancelAtTime !== undefined &&
        context &&
        cancelAtTime > context.currentTime
      ) {
        if (
          group.cancelAtTime === undefined ||
          cancelAtTime < group.cancelAtTime
        ) {
          group.cancelAtTime = cancelAtTime;
          group.releaseSeconds = releaseSeconds;
        }
        group.hits.forEach((hit) => applyScheduledGroupCancelToHit(group, hit));
        group.voices.forEach((voiceHandle) =>
          applyScheduledGroupCancelToVoice(group, voiceHandle),
        );
        clearPlaybackGroupCancelTimer(group);
        group.cancelTimer = globalThis.setTimeout(
          () => deletePlaybackGroup(handle),
          Math.max(0, (group.cancelAtTime - context.currentTime + 0.25) * 1000),
        );
        return;
      }

      group.hits.forEach((hit) => hit.stop());
      group.voices.forEach((voiceHandle) =>
        stopVoice(voiceHandle, releaseSeconds),
      );
      deletePlaybackGroup(handle);
    },
    createPlaybackGroup: () => {
      const handle = createPlaybackGroupHandle((nextGroupId += 1));
      playbackGroups.set(handle, {
        hits: new Set(),
        voices: new Set(),
      });
      return handle;
    },
    getCurrentTime: () => context?.currentTime,
    getOutputClock: (): AudioClockSnapshot | undefined => {
      if (!context || context.state === "closed") {
        return undefined;
      }

      const outputTimestamp = context.getOutputTimestamp?.();

      return {
        contextTime: outputTimestamp?.contextTime ?? context.currentTime,
        performanceTime: outputTimestamp?.performanceTime ?? getNow(),
      };
    },
    isSupported: () => getAudioContextConstructor() !== undefined,
    prime: async () => {
      const audioContext = await getReadyAudioContext();

      if (!audioContext) {
        return false;
      }

      return loadAllSamplePacks(audioContext);
    },
    warm: async () => {
      const audioContext = await getWarmAudioContext();

      if (!audioContext) {
        return false;
      }

      return loadAllSamplePacks(audioContext);
    },
    playNote: async (request) => {
      const preset = getPresetForRequest(request);
      const audioContext = await getReadyAudioContext();

      if (
        request.signal?.aborted ||
        !audioContext ||
        !isPlayableMidiNote(request.midiNote)
      ) {
        return undefined;
      }

      const loaded = await samplePackLoader.loadSamplePack(
        audioContext,
        preset.samplePackId,
      );

      if (!loaded || request.signal?.aborted) {
        return undefined;
      }

      return createManagedSampleVoice({
        audioContext,
        concertPitchHz: request.concertPitchHz,
        durationSeconds: request.durationSeconds,
        midiNote: request.midiNote,
        preset,
        startTime: audioContext.currentTime,
        use: request.use,
        velocity: request.velocity,
      });
    },
    schedulePercussionHit: (request: SchedulePercussionHitRequest) => {
      if (!context || context.state === "closed") {
        void getReadyAudioContext();
        return false;
      }

      const group = playbackGroups.get(request.group);

      if (!group) {
        return false;
      }

      if (
        group.cancelAtTime !== undefined &&
        request.startTime >= group.cancelAtTime
      ) {
        return false;
      }

      const loaded = samplePackLoader.getLoadedSamplePack(
        PERCUSSION_SAMPLE_PACK_ID,
      );

      if (!loaded) {
        void samplePackLoader.loadSamplePack(
          context,
          PERCUSSION_SAMPLE_PACK_ID,
        );
        return false;
      }

      const hitRef: { current?: ScheduledHit } = {};
      const hit = schedulePercussionHit({
        context,
        destination: context.destination,
        loaded,
        onEnded: () => {
          if (hitRef.current) {
            group.hits.delete(hitRef.current);
          }
        },
        sampleId: request.sampleId,
        startTime: request.startTime,
        velocity: request.velocity,
      });
      if (!hit) {
        return false;
      }

      hitRef.current = hit;
      group.hits.add(hit);
      applyScheduledGroupCancelToHit(group, hit);
      return true;
    },
    scheduleMetronomeClick: (request: ScheduleMetronomeClickRequest) => {
      if (!context || context.state === "closed") {
        void getReadyAudioContext();
        return false;
      }

      const group = playbackGroups.get(request.group);

      if (!group) {
        return false;
      }

      if (
        group.cancelAtTime !== undefined &&
        request.startTime >= group.cancelAtTime
      ) {
        return false;
      }

      const loaded = samplePackLoader.getLoadedSamplePack(
        PERCUSSION_SAMPLE_PACK_ID,
      );

      if (!loaded) {
        void samplePackLoader.loadSamplePack(
          context,
          PERCUSSION_SAMPLE_PACK_ID,
        );
        return false;
      }

      const hitRef: { current?: ScheduledHit } = {};
      const hit = scheduleMetronomeClick({
        accent: request.accent ?? false,
        context,
        destination: context.destination,
        loaded,
        onEnded: () => {
          if (hitRef.current) {
            group.hits.delete(hitRef.current);
          }
        },
        startTime: request.startTime,
      });
      if (!hit) {
        return false;
      }

      hitRef.current = hit;
      group.hits.add(hit);
      applyScheduledGroupCancelToHit(group, hit);
      return true;
    },
    scheduleNote: (request: ScheduleNoteRequest) => {
      if (!context || context.state === "closed") {
        void getReadyAudioContext();
        return undefined;
      }

      const group = playbackGroups.get(request.group);
      const preset = getPresetForRequest(request);

      if (!group) {
        return undefined;
      }

      if (
        group.cancelAtTime !== undefined &&
        request.startTime >= group.cancelAtTime
      ) {
        return undefined;
      }

      const handle = createManagedSampleVoice({
        audioContext: context,
        concertPitchHz: request.concertPitchHz,
        durationSeconds: request.durationSeconds,
        group: request.group,
        midiNote: request.midiNote,
        preset,
        startTime: request.startTime,
        use: request.use,
        velocity: request.velocity,
      });

      if (handle) {
        applyScheduledGroupCancelToVoice(group, handle);
      }

      return handle;
    },
    subscribeToStopAll: (listener: () => void) => {
      stopAllListeners.add(listener);

      return () => {
        stopAllListeners.delete(listener);
      };
    },
    subscribeToVoiceEnd: (handle: AudioVoiceHandle, listener: () => void) => {
      if (endedVoices.has(handle)) {
        queueMicrotask(listener);
        return () => undefined;
      }

      const listeners = voiceEndListeners.get(handle) ?? new Set<() => void>();
      listeners.add(listener);
      voiceEndListeners.set(handle, listeners);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          voiceEndListeners.delete(handle);
        }
      };
    },
    createDrone: async (request: DroneRequest) => {
      const notes = request.notes.filter((note) =>
        isPlayableMidiNote(note.midiNote),
      );

      if (notes.length === 0) {
        return undefined;
      }

      const audioContext = await getReadyAudioContext();
      const preset = getPresetForRequest({
        presetId: request.presetId,
        use: request.use ?? "drone",
      });

      if (!audioContext) {
        return undefined;
      }

      const loaded = await samplePackLoader.loadSamplePack(
        audioContext,
        preset.samplePackId,
      );

      if (!loaded) {
        return undefined;
      }

      const concertPitchHz = getConcertPitchHz(request.concertPitchHz);
      const droneNotes = new Map<string, ActiveDroneVoice>();

      notes.forEach((note) => {
        const voice = createDroneVoice({
          buffer: loaded.buffer,
          concertPitchHz,
          context: audioContext,
          midiNote: note.midiNote,
          pack: loaded.pack,
          preset,
          velocity: note.velocity,
        });

        if (voice) {
          droneNotes.set(note.id, voice);
        }
      });

      if (droneNotes.size === 0) {
        return undefined;
      }

      const handle = createDroneHandle((nextDroneId += 1));
      activeDrones.set(handle, {
        concertPitchHz,
        context: audioContext,
        notes: droneNotes,
        packId: preset.samplePackId,
        preset,
      });

      return handle;
    },
    destroyDrone: (handle: DroneHandle) => {
      const drone = activeDrones.get(handle);

      if (!drone) {
        return;
      }

      stopDrone(drone);
      activeDrones.delete(handle);
    },
    updateDrone: (handle: DroneHandle, request: DroneRequest) => {
      const drone = activeDrones.get(handle);

      if (!drone || drone.context.state === "closed") {
        return false;
      }

      const preset = getPresetForRequest({
        presetId: request.presetId,
        use: request.use ?? "drone",
      });
      const loaded = samplePackLoader.getLoadedSamplePack(preset.samplePackId);

      if (!loaded) {
        stopDrone(drone, 0.05);
        activeDrones.delete(handle);
        return false;
      }

      const concertPitchHz = getConcertPitchHz(request.concertPitchHz);

      if (
        preset.samplePackId !== drone.packId ||
        concertPitchHz !== drone.concertPitchHz
      ) {
        stopDrone(drone, 0.05);
        activeDrones.delete(handle);
        return false;
      }

      const nextNotes = new Map(
        request.notes
          .filter((note) => isPlayableMidiNote(note.midiNote))
          .map((note) => [note.id, note]),
      );

      drone.notes.forEach((voice, noteId) => {
        if (!nextNotes.has(noteId)) {
          stopDroneVoice(voice, drone.context);
          drone.notes.delete(noteId);
        }
      });

      nextNotes.forEach((note, noteId) => {
        const currentVoice = drone.notes.get(noteId);

        if (
          currentVoice &&
          currentVoice.midiNote === note.midiNote &&
          currentVoice.velocity === (note.velocity ?? 1)
        ) {
          return;
        }

        if (currentVoice) {
          stopDroneVoice(currentVoice, drone.context, 0.08);
        }

        const voice = createDroneVoice({
          buffer: loaded.buffer,
          concertPitchHz,
          context: drone.context,
          midiNote: note.midiNote,
          pack: loaded.pack,
          preset,
          velocity: note.velocity,
        });

        if (voice) {
          drone.notes.set(noteId, voice);
        } else {
          drone.notes.delete(noteId);
        }
      });

      if (drone.notes.size === 0) {
        activeDrones.delete(handle);
        return false;
      }

      drone.preset = preset;
      return true;
    },
    stopAll: () => {
      Array.from(playbackGroups.entries()).forEach(([groupHandle, group]) => {
        group.hits.forEach((hit) => hit.stop());
        group.voices.forEach((voiceHandle) => stopVoice(voiceHandle, 0.02));
        deletePlaybackGroup(groupHandle);
      });
      activeDrones.forEach((drone) => stopDrone(drone, 0.05));
      activeDrones.clear();
      stopAllListeners.forEach((listener) => listener());
    },
  };
}

export const musoAudioEngine = createWebAudioEngine();
