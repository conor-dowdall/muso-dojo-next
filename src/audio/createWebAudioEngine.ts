import { getAudioContextConstructor } from "./audioContext";
import { scheduleMetronomeClick } from "./metronome";
import { getDefaultAudioPresetId, resolveAudioPreset } from "./presets";
import { DEFAULT_CONCERT_PITCH_HZ, isPlayableMidiNote } from "./pitch";
import { samplePacks } from "./samplePacks.generated";
import {
  type AudioClockSnapshot,
  type AudioEngine,
  type AudioPreset,
  type AudioUse,
  type AudioVoiceHandle,
  type DroneHandle,
  type DroneRequest,
  type MasterAmbiencePresetId,
  type PlaybackGroupHandle,
  type PlayNoteRequest,
  type SamplePackId,
  type ScheduleMetronomeClickRequest,
  type ScheduleNoteRequest,
} from "./types";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const DEFAULT_MASTER_AMBIENCE_PRESET_ID =
  "dry" satisfies MasterAmbiencePresetId;
const MIN_GAIN_VALUE = 0.0001;
const MIN_ATTACK_SECONDS = 0.003;
const MIN_RELEASE_SECONDS = 0.02;
const MAX_ONE_SHOT_RELEASE_SECONDS = 0.35;
const DRONE_RELEASE_SECONDS = 0.22;
const GROUP_CANCEL_RELEASE_SECONDS = 0.03;
const SAMPLE_PACK_IDS = Object.keys(samplePacks) as SamplePackId[];

type SamplePack = (typeof samplePacks)[SamplePackId];
type SampleRegion = SamplePack["regions"][number];

interface LoadedSamplePack {
  buffer: AudioBuffer;
  pack: SamplePack;
}

interface PlaybackGroup {
  clicks: Set<ScheduledClick>;
  voices: Set<AudioVoiceHandle>;
}

interface ScheduledClick {
  disconnect: () => void;
  stop: () => void;
}

interface ActiveVoice {
  disconnect: () => void;
  gain: GainNode;
  group?: PlaybackGroupHandle;
  source: AudioBufferSourceNode;
  stop: (releaseSeconds?: number) => void;
}

interface ActiveDroneVoice {
  gain: GainNode;
  midiNote: number;
  source: AudioBufferSourceNode;
  stop: (releaseSeconds?: number) => void;
  velocity: number;
}

interface ActiveDrone {
  concertPitchHz: number;
  context: AudioContext;
  notes: Map<string, ActiveDroneVoice>;
  packId: SamplePackId;
  preset: AudioPreset;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function getSamplePackId(preset: AudioPreset) {
  return preset.samplePackId ?? "piano";
}

function getConcertPitchHz(concertPitchHz: number | undefined) {
  return concertPitchHz && Number.isFinite(concertPitchHz)
    ? concertPitchHz
    : DEFAULT_CONCERT_PITCH_HZ;
}

function getPlaybackRate({
  concertPitchHz,
  midiNote,
  region,
}: {
  concertPitchHz: number;
  midiNote: number;
  region: SampleRegion;
}) {
  const concertPitchCents =
    1200 * Math.log2(concertPitchHz / DEFAULT_CONCERT_PITCH_HZ);
  return 2 ** ((midiNote * 100 + concertPitchCents - region.rootCents) / 1200);
}

function getRegionEndSeconds(region: SampleRegion) {
  return region.offsetSeconds + region.durationSeconds;
}

function getLoopStartSeconds(region: SampleRegion) {
  return "loopStartSeconds" in region ? region.loopStartSeconds : undefined;
}

function getLoopEndSeconds(region: SampleRegion) {
  return "loopEndSeconds" in region ? region.loopEndSeconds : undefined;
}

function regionHasLoop(region: SampleRegion) {
  const loopStartSeconds = getLoopStartSeconds(region);
  const loopEndSeconds = getLoopEndSeconds(region);

  return (
    loopStartSeconds !== undefined &&
    loopEndSeconds !== undefined &&
    loopEndSeconds > loopStartSeconds &&
    loopStartSeconds >= region.offsetSeconds &&
    loopEndSeconds <= getRegionEndSeconds(region) + 0.001
  );
}

function getRegionForMidi(pack: SamplePack, midiNote: number) {
  return (
    pack.regions.find(
      (region) => midiNote >= region.lowMidi && midiNote <= region.highMidi,
    ) ??
    pack.regions.reduce((closest, region) =>
      Math.abs(region.rootMidi - midiNote) <
      Math.abs(closest.rootMidi - midiNote)
        ? region
        : closest,
    )
  );
}

function getScheduledOffset({
  context,
  loop,
  playbackRate,
  region,
  startTime,
}: {
  context: AudioContext;
  loop: boolean;
  playbackRate: number;
  region: SampleRegion;
  startTime: number;
}) {
  const lateBufferSeconds =
    Math.max(0, context.currentTime - startTime) * playbackRate;
  const regionEndSeconds = getRegionEndSeconds(region);

  if (!loop) {
    const offsetSeconds = region.offsetSeconds + lateBufferSeconds;

    return offsetSeconds < regionEndSeconds ? offsetSeconds : undefined;
  }

  const loopStartSeconds = getLoopStartSeconds(region);
  const loopEndSeconds = getLoopEndSeconds(region);

  if (loopStartSeconds === undefined || loopEndSeconds === undefined) {
    return region.offsetSeconds;
  }

  const preLoopSeconds = loopStartSeconds - region.offsetSeconds;

  if (lateBufferSeconds <= preLoopSeconds) {
    return region.offsetSeconds + lateBufferSeconds;
  }

  const loopDurationSeconds = loopEndSeconds - loopStartSeconds;
  const loopOffsetSeconds =
    (lateBufferSeconds - preLoopSeconds) % loopDurationSeconds;

  return loopStartSeconds + loopOffsetSeconds;
}

function getVoiceGain({
  preset,
  region,
  use = DEFAULT_AUDIO_USE,
  velocity,
}: {
  preset: AudioPreset;
  region: SampleRegion;
  use?: AudioUse;
  velocity?: number;
}) {
  const useGain = use === "drone" ? 0.78 : use === "exercise" ? 0.86 : 0.9;

  return (
    clamp(velocity ?? 0.82, 0, 1) * preset.voice.gain * region.gain * useGain
  );
}

function getAttackSeconds(preset: AudioPreset) {
  return Math.max(MIN_ATTACK_SECONDS, preset.voice.envelope.attackSeconds);
}

function getReleaseSeconds(preset: AudioPreset, durationSeconds: number) {
  return clamp(
    preset.voice.envelope.releaseSeconds,
    MIN_RELEASE_SECONDS,
    Math.min(MAX_ONE_SHOT_RELEASE_SECONDS, durationSeconds * 0.5),
  );
}

function startSource({
  durationSeconds,
  offsetSeconds,
  source,
  startTime,
}: {
  durationSeconds?: number;
  offsetSeconds: number;
  source: AudioBufferSourceNode;
  startTime: number;
}) {
  if (durationSeconds === undefined) {
    source.start(startTime, offsetSeconds);
    return;
  }

  source.start(startTime, offsetSeconds, durationSeconds);
}

export function createWebAudioEngine(): AudioEngine {
  const resetListeners = new Set<() => void>();
  const stopAllListeners = new Set<() => void>();
  const loadedPacks = new Map<SamplePackId, LoadedSamplePack>();
  const loadingPacks = new Map<
    SamplePackId,
    Promise<LoadedSamplePack | undefined>
  >();
  const playbackGroups = new Map<PlaybackGroupHandle, PlaybackGroup>();
  const activeVoices = new Map<AudioVoiceHandle, ActiveVoice>();
  const voiceEndListeners = new Map<AudioVoiceHandle, Set<() => void>>();
  const endedVoices = new Set<AudioVoiceHandle>();
  const activeDrones = new Map<DroneHandle, ActiveDrone>();
  let context: AudioContext | undefined;
  let nextGroupId = 0;
  let nextVoiceId = 0;
  let nextDroneId = 0;
  let masterAmbiencePresetId: MasterAmbiencePresetId =
    DEFAULT_MASTER_AMBIENCE_PRESET_ID;

  const getReadyAudioContext = async () => {
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

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return undefined;
      }
    }

    return context.state === "closed" ? undefined : context;
  };

  const loadSamplePack = async (
    audioContext: AudioContext,
    packId: SamplePackId,
  ) => {
    const loaded = loadedPacks.get(packId);

    if (loaded) {
      return loaded;
    }

    const loading = loadingPacks.get(packId);

    if (loading) {
      return loading;
    }

    const pack = samplePacks[packId];
    const loadPromise = fetch(pack.url)
      .then((response) => (response.ok ? response.arrayBuffer() : undefined))
      .then((arrayBuffer) =>
        arrayBuffer
          ? audioContext.decodeAudioData(arrayBuffer.slice(0))
          : undefined,
      )
      .then((buffer) => {
        if (!buffer) {
          return undefined;
        }

        const loadedPack = { buffer, pack };
        loadedPacks.set(packId, loadedPack);
        return loadedPack;
      })
      .catch(() => undefined)
      .finally(() => {
        loadingPacks.delete(packId);
      });

    loadingPacks.set(packId, loadPromise);
    return loadPromise;
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
  ) => {
    activeVoices.get(handle)?.stop(releaseSeconds);
  };

  const createSampleVoice = ({
    buffer,
    context: audioContext,
    durationSeconds,
    group,
    midiNote,
    pack,
    preset,
    startTime,
    use = DEFAULT_AUDIO_USE,
    velocity,
    concertPitchHz,
  }: {
    buffer: AudioBuffer;
    concertPitchHz?: number;
    context: AudioContext;
    durationSeconds?: number;
    group?: PlaybackGroupHandle;
    midiNote: number;
    pack: SamplePack;
    preset: AudioPreset;
    startTime: number;
    use?: AudioUse;
    velocity?: number;
  }) => {
    if (!isPlayableMidiNote(midiNote)) {
      return undefined;
    }

    const region = getRegionForMidi(pack, midiNote);
    const playbackRate = getPlaybackRate({
      concertPitchHz: getConcertPitchHz(concertPitchHz),
      midiNote,
      region,
    });
    const requestedDurationSeconds =
      durationSeconds ?? preset.defaultDurationSeconds;

    if (requestedDurationSeconds <= 0 || playbackRate <= 0) {
      return undefined;
    }

    const naturalDurationSeconds = region.durationSeconds / playbackRate;
    const shouldLoop =
      regionHasLoop(region) &&
      requestedDurationSeconds + preset.voice.envelope.releaseSeconds >
        naturalDurationSeconds;
    const offsetSeconds = getScheduledOffset({
      context: audioContext,
      loop: shouldLoop,
      playbackRate,
      region,
      startTime,
    });

    if (offsetSeconds === undefined) {
      return undefined;
    }

    const startAt = Math.max(audioContext.currentTime, startTime);
    const attackSeconds = Math.min(
      getAttackSeconds(preset),
      requestedDurationSeconds * 0.25,
    );
    const releaseSeconds = getReleaseSeconds(preset, requestedDurationSeconds);
    const releaseStartTime = Math.max(
      startAt + MIN_ATTACK_SECONDS,
      startTime + requestedDurationSeconds,
    );
    const releaseEndTime = releaseStartTime + releaseSeconds;
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const voiceGain = getVoiceGain({ preset, region, use, velocity });
    const handle = createVoiceHandle((nextVoiceId += 1));
    let disconnected = false;
    let cancelStopRequested = false;

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, startAt);

    if (shouldLoop) {
      source.loop = true;
      source.loopStart = getLoopStartSeconds(region) ?? region.offsetSeconds;
      source.loopEnd = getLoopEndSeconds(region) ?? getRegionEndSeconds(region);
    }

    gain.gain.setValueAtTime(MIN_GAIN_VALUE, startAt);
    gain.gain.linearRampToValueAtTime(
      Math.max(MIN_GAIN_VALUE, voiceGain),
      startAt + attackSeconds,
    );
    gain.gain.setValueAtTime(
      Math.max(MIN_GAIN_VALUE, voiceGain),
      releaseStartTime,
    );
    gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, releaseEndTime);

    source.connect(gain);
    gain.connect(audioContext.destination);

    const disconnect = () => {
      if (disconnected) {
        return;
      }

      disconnected = true;
      try {
        source.disconnect();
      } catch {
        // The browser may have already disconnected the source.
      }
      try {
        gain.disconnect();
      } catch {
        // The browser may have already disconnected the gain.
      }
    };

    const stop = (nextReleaseSeconds = releaseSeconds) => {
      if (cancelStopRequested) {
        return;
      }

      cancelStopRequested = true;
      const stopStartTime = Math.max(audioContext.currentTime, startAt);
      const stopTime = stopStartTime + Math.max(0, nextReleaseSeconds);

      gain.gain.cancelScheduledValues(stopStartTime);
      gain.gain.setValueAtTime(
        Math.max(MIN_GAIN_VALUE, gain.gain.value),
        stopStartTime,
      );
      gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, stopTime);

      try {
        source.stop(stopTime + 0.01);
      } catch {
        finishVoice(handle);
      }
    };

    source.addEventListener("ended", () => finishVoice(handle), {
      once: true,
    });
    activeVoices.set(handle, {
      disconnect,
      gain,
      group,
      source,
      stop,
    });
    if (group) {
      playbackGroups.get(group)?.voices.add(handle);
    }

    try {
      startSource({
        durationSeconds: shouldLoop
          ? undefined
          : getRegionEndSeconds(region) - offsetSeconds,
        offsetSeconds,
        source,
        startTime: startAt,
      });

      if (shouldLoop || releaseEndTime < startAt + naturalDurationSeconds) {
        source.stop(releaseEndTime + 0.01);
      }
    } catch {
      activeVoices.delete(handle);
      playbackGroups.get(group as PlaybackGroupHandle)?.voices.delete(handle);
      disconnect();
      return undefined;
    }

    return handle;
  };

  const stopDroneVoice = (
    droneVoice: ActiveDroneVoice,
    audioContext: AudioContext,
    releaseSeconds = DRONE_RELEASE_SECONDS,
  ) => {
    const stopStartTime = audioContext.currentTime;
    const stopTime = stopStartTime + Math.max(0, releaseSeconds);

    droneVoice.gain.gain.cancelScheduledValues(stopStartTime);
    droneVoice.gain.gain.setValueAtTime(
      Math.max(MIN_GAIN_VALUE, droneVoice.gain.gain.value),
      stopStartTime,
    );
    droneVoice.gain.gain.linearRampToValueAtTime(MIN_GAIN_VALUE, stopTime);

    try {
      droneVoice.source.stop(stopTime + 0.01);
    } catch {
      try {
        droneVoice.source.disconnect();
        droneVoice.gain.disconnect();
      } catch {
        // The drone voice may already have stopped.
      }
    }
  };

  const createDroneVoice = ({
    buffer,
    concertPitchHz,
    context: audioContext,
    midiNote,
    pack,
    preset,
    velocity,
  }: {
    buffer: AudioBuffer;
    concertPitchHz: number;
    context: AudioContext;
    midiNote: number;
    pack: SamplePack;
    preset: AudioPreset;
    velocity?: number;
  }) => {
    if (!isPlayableMidiNote(midiNote)) {
      return undefined;
    }

    const region = getRegionForMidi(pack, midiNote);

    if (!regionHasLoop(region)) {
      return undefined;
    }

    const startTime = audioContext.currentTime;
    const playbackRate = getPlaybackRate({
      concertPitchHz,
      midiNote,
      region,
    });
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const voiceGain = getVoiceGain({
      preset,
      region,
      use: "drone",
      velocity,
    });
    const attackSeconds = Math.max(0.04, getAttackSeconds(preset));

    source.buffer = buffer;
    source.loop = true;
    source.loopStart = getLoopStartSeconds(region) ?? region.offsetSeconds;
    source.loopEnd = getLoopEndSeconds(region) ?? getRegionEndSeconds(region);
    source.playbackRate.setValueAtTime(playbackRate, startTime);
    gain.gain.setValueAtTime(MIN_GAIN_VALUE, startTime);
    gain.gain.linearRampToValueAtTime(
      Math.max(MIN_GAIN_VALUE, voiceGain),
      startTime + attackSeconds,
    );
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start(startTime, region.offsetSeconds);
    source.addEventListener(
      "ended",
      () => {
        try {
          source.disconnect();
        } catch {
          // The browser may have already disconnected the source.
        }
        try {
          gain.disconnect();
        } catch {
          // The browser may have already disconnected the gain.
        }
      },
      { once: true },
    );

    const droneVoice = {
      gain,
      midiNote,
      source,
      stop: (releaseSeconds?: number) =>
        stopDroneVoice(droneVoice, audioContext, releaseSeconds),
      velocity: velocity ?? 1,
    } satisfies ActiveDroneVoice;

    return droneVoice;
  };

  const stopDrone = (
    drone: ActiveDrone,
    releaseSeconds = DRONE_RELEASE_SECONDS,
  ) => {
    drone.notes.forEach((voice) =>
      stopDroneVoice(voice, drone.context, releaseSeconds),
    );
    drone.notes.clear();
  };

  return {
    cancelPlaybackGroup: (handle, options) => {
      const group = playbackGroups.get(handle);

      if (!group) {
        return;
      }

      group.clicks.forEach((click) => {
        click.stop();
        click.disconnect();
      });
      group.voices.forEach((voiceHandle) =>
        stopVoice(voiceHandle, options?.releaseSeconds),
      );
      playbackGroups.delete(handle);
    },
    createPlaybackGroup: () => {
      const handle = createPlaybackGroupHandle((nextGroupId += 1));
      playbackGroups.set(handle, {
        clicks: new Set(),
        voices: new Set(),
      });
      return handle;
    },
    getCurrentTime: () => context?.currentTime,
    getMasterAmbiencePresetId: () => masterAmbiencePresetId,
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

      const packs = await Promise.all(
        SAMPLE_PACK_IDS.map((packId) => loadSamplePack(audioContext, packId)),
      );

      return packs.every(Boolean);
    },
    playNote: async (request) => {
      const preset = getPresetForRequest(request);
      const audioContext = await getReadyAudioContext();

      if (!audioContext || !isPlayableMidiNote(request.midiNote)) {
        return undefined;
      }

      const loaded = await loadSamplePack(
        audioContext,
        getSamplePackId(preset),
      );

      if (!loaded) {
        return undefined;
      }

      return createSampleVoice({
        buffer: loaded.buffer,
        concertPitchHz: request.concertPitchHz,
        context: audioContext,
        durationSeconds: request.durationSeconds,
        midiNote: request.midiNote,
        pack: loaded.pack,
        preset,
        startTime: audioContext.currentTime,
        use: request.use,
        velocity: request.velocity,
      });
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

      const click = scheduleMetronomeClick({
        accent: request.accent ?? false,
        context,
        destination: context.destination,
        onEnded: () => group.clicks.delete(click),
        startTime: request.startTime,
      });
      group.clicks.add(click);
      return true;
    },
    scheduleNote: (request: ScheduleNoteRequest) => {
      if (!context || context.state === "closed") {
        void getReadyAudioContext();
        return undefined;
      }

      const group = playbackGroups.get(request.group);
      const preset = getPresetForRequest(request);
      const loaded = loadedPacks.get(getSamplePackId(preset));

      if (!group || !loaded) {
        void loadSamplePack(context, getSamplePackId(preset));
        return undefined;
      }

      return createSampleVoice({
        buffer: loaded.buffer,
        concertPitchHz: request.concertPitchHz,
        context,
        durationSeconds: request.durationSeconds,
        group: request.group,
        midiNote: request.midiNote,
        pack: loaded.pack,
        preset,
        startTime: request.startTime,
        use: request.use,
        velocity: request.velocity,
      });
    },
    setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => {
      masterAmbiencePresetId = presetId;
    },
    subscribeToReset: (listener: () => void) => {
      resetListeners.add(listener);

      return () => {
        resetListeners.delete(listener);
      };
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

      const packId = getSamplePackId(preset);
      const loaded = await loadSamplePack(audioContext, packId);

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
        packId,
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
      const packId = getSamplePackId(preset);
      const loaded = loadedPacks.get(packId);

      if (!loaded) {
        stopDrone(drone, 0.05);
        activeDrones.delete(handle);
        return false;
      }

      const concertPitchHz = getConcertPitchHz(request.concertPitchHz);

      if (packId !== drone.packId || concertPitchHz !== drone.concertPitchHz) {
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
      playbackGroups.forEach((group) => {
        group.clicks.forEach((click) => {
          click.stop();
          click.disconnect();
        });
        group.voices.forEach((handle) => stopVoice(handle, 0.02));
      });
      playbackGroups.clear();
      activeDrones.forEach((drone) => stopDrone(drone, 0.05));
      activeDrones.clear();
      stopAllListeners.forEach((listener) => listener());
    },
  };
}

export const musoAudioEngine = createWebAudioEngine();
