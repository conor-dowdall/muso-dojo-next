import { getAudioContextConstructor } from "./audioContext";
import {
  getOneShotEnvelopeGainAtTime,
  scheduleAttackDecayEnvelope,
  scheduleOneShotEnvelope,
} from "./envelope";
import {
  connectAudioEffectChain,
  type ConnectedAudioEffectChain,
} from "./effects";
import {
  canUseNativeSineOscillator,
  createHarmonicWaveCache,
} from "./harmonicWave";
import { DEFAULT_MASTER_AMBIENCE_PRESET_ID } from "./masterAmbience";
import {
  scheduleMetronomeClick,
  type ScheduledMetronomeClick,
} from "./metronome";
import { createAudioMixer, type AudioMixer } from "./mixer";
import { normalizePositiveNumber } from "./numeric";
import { midiToFrequency, isPlayableMidiNote } from "./pitch";
import {
  audioPresets,
  getDefaultAudioPresetId,
  resolveAudioPreset,
} from "./presets";
import {
  createHarmonicVoice,
  getHarmonicVoiceLevelGain,
  getVoiceStopSilenceSeconds,
  type ActiveVoice,
} from "./voice";
import { resolveHarmonicVoiceConfig } from "./voiceConfig";
import {
  type AudioEngine,
  type AudioClockSnapshot,
  type AudioPreset,
  type AudioUse,
  type AudioVoiceHandle,
  type DroneHandle,
  type DroneNoteRequest,
  type DroneRequest,
  type MasterAmbiencePresetId,
  type PlayNoteRequest,
  type PlaybackGroupHandle,
  type ScheduleMetronomeClickRequest,
  type ScheduleNoteRequest,
  type VoiceInsertEffectConfig,
} from "./types";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const DEFAULT_DRONE_USE = "drone" satisfies AudioUse;
const MIN_NOTE_DURATION_SECONDS = 0.02;
const CLEANUP_DELAY_SECONDS = 0.05;
const SILENT_UNLOCK_PULSE_SECONDS = 0.01;
const AUDIO_RENDER_QUANTUM_FRAMES = 128;
const ONE_SHOT_RAMP_RENDER_QUANTA = 1;
const MIN_SCHEDULE_LOOKAHEAD_SECONDS = 0.006;
const DRONE_MIN_ATTACK_SECONDS = 0.012;
const DRONE_MIN_RELEASE_SECONDS = 0.04;
const DRONE_LEVEL_RAMP_SECONDS = 0.035;
const DRONE_PITCH_GLIDE_SECONDS = 0.075;
const DRONE_PRESET_CROSSFADE_SECONDS = 0.09;
const WARMUP_MIDI_NOTES = [36, 48, 60, 72] as const;
const DEFAULT_GROUP_RELEASE_SECONDS = 0.035;

interface ActivePlaybackGroup {
  clicks: Set<ScheduledMetronomeClick>;
  voices: Set<AudioVoiceHandle>;
}

interface ActiveDrone {
  concertPitchHz: number | undefined;
  context: AudioContext;
  currentGraph: DroneEffectGraph | undefined;
  destroyed: boolean;
  graphs: Set<DroneEffectGraph>;
  handle: DroneHandle;
  output: GainNode;
  presetId: AudioPreset["id"];
  use: AudioUse;
  voices: Map<string, ActiveDroneVoice>;
}

interface ActiveDroneVoice {
  request: DroneNoteRequest;
  voice: ActiveVoice;
}

interface DroneEffectGraph {
  cleanupTimer: number | undefined;
  disposed: boolean;
  effectChain: ConnectedAudioEffectChain | undefined;
  input: GainNode | undefined;
  perVoiceEffects: readonly VoiceInsertEffectConfig[];
  presetId: AudioPreset["id"];
  refCount: number;
  tailSeconds: number;
  voiceDestination: AudioNode;
}

function partitionDroneInsertEffects(
  effects: readonly VoiceInsertEffectConfig[],
) {
  const canShareEffects =
    effects.length > 0 && effects.every((effect) => effect.type === "chorus");

  return {
    perVoiceEffects: canShareEffects ? [] : effects,
    sharedEffects: canShareEffects ? effects : [],
  };
}

function getScheduleLookaheadSeconds(context: AudioContext) {
  return Math.max(
    MIN_SCHEDULE_LOOKAHEAD_SECONDS,
    (AUDIO_RENDER_QUANTUM_FRAMES * 2) / context.sampleRate,
  );
}

function getOneShotMinimumRampSeconds(context: AudioContext) {
  return (
    (AUDIO_RENDER_QUANTUM_FRAMES * ONE_SHOT_RAMP_RENDER_QUANTA) /
    context.sampleRate
  );
}

export function createWebAudioEngine(): AudioEngine {
  let audioContext: AudioContext | undefined;
  let masterAmbiencePresetId: MasterAmbiencePresetId =
    DEFAULT_MASTER_AMBIENCE_PRESET_ID;
  let audioMixer: AudioMixer | undefined;
  let primedContext: AudioContext | undefined;
  let readyContextPromise: Promise<AudioContext | undefined> | undefined;
  let nextVoiceId = 0;
  let nextDroneId = 0;
  let nextPlaybackGroupId = 0;
  const activeVoices = new Map<AudioVoiceHandle, ActiveVoice>();
  const activeVoiceStartTimes = new Map<AudioVoiceHandle, number>();
  const activeDrones = new Map<DroneHandle, ActiveDrone>();
  const playbackGroups = new Map<PlaybackGroupHandle, ActivePlaybackGroup>();
  const resetListeners = new Set<() => void>();
  const stopAllListeners = new Set<() => void>();
  const voiceEndListeners = new Map<AudioVoiceHandle, Set<() => void>>();
  const harmonicWaveCache = createHarmonicWaveCache();

  function emitVoiceEnd(handle: AudioVoiceHandle) {
    const listeners = voiceEndListeners.get(handle);

    if (!listeners) {
      return;
    }

    voiceEndListeners.delete(handle);
    listeners.forEach((listener) => listener());
  }

  function clearContextReferences() {
    try {
      activeDrones.forEach((drone) => {
        drone.destroyed = true;
        drone.voices.forEach(({ voice }) => voice.disconnect());
        [...drone.graphs].forEach((graph) =>
          disposeDroneEffectGraph(drone, graph),
        );
        drone.output.disconnect();
      });
      playbackGroups.forEach((group) => {
        group.clicks.forEach((click) => {
          click.stop();
          click.disconnect();
        });
      });
      audioMixer?.dispose();
    } catch {
      // The browser may already have torn down the underlying audio graph.
    }

    activeDrones.clear();
    activeVoices.forEach((voice) => emitVoiceEnd(voice.handle));
    activeVoices.clear();
    activeVoiceStartTimes.clear();
    playbackGroups.clear();
    audioContext = undefined;
    audioMixer = undefined;
    primedContext = undefined;
    readyContextPromise = undefined;
    resetListeners.forEach((listener) => listener());
  }

  function getAudioContext() {
    if (audioContext?.state === "closed") {
      clearContextReferences();
    }

    if (audioContext) {
      return audioContext;
    }

    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return undefined;
    }

    try {
      audioContext = new AudioContextConstructor({
        latencyHint: "interactive",
      });
      const createdContext = audioContext;

      createdContext.addEventListener("statechange", () => {
        if (
          createdContext.state === "closed" &&
          audioContext === createdContext
        ) {
          clearContextReferences();
        }
      });
    } catch {
      return undefined;
    }

    return audioContext;
  }

  function getRunningAudioContext() {
    const context = getAudioContext();

    return context?.state === "running" ? context : undefined;
  }

  async function getReadyAudioContext() {
    const runningContext = getRunningAudioContext();

    if (runningContext) {
      return runningContext;
    }

    if (readyContextPromise) {
      return readyContextPromise;
    }

    const context = getAudioContext();

    if (!context) {
      return undefined;
    }

    readyContextPromise = (async () => {
      try {
        if (context.state !== "running") {
          await context.resume();
        }
      } catch {
        return undefined;
      }

      return context.state === "running" ? context : undefined;
    })().finally(() => {
      readyContextPromise = undefined;
    });

    return readyContextPromise;
  }

  function getAudioMixer(context: AudioContext) {
    if (!audioMixer) {
      audioMixer = createAudioMixer({
        context,
        masterAmbiencePresetId,
      });
    }

    return audioMixer;
  }

  function disposeDroneEffectGraph(
    drone: ActiveDrone,
    graph: DroneEffectGraph,
  ) {
    if (graph.disposed) {
      return;
    }

    graph.disposed = true;

    if (graph.cleanupTimer !== undefined) {
      window.clearTimeout(graph.cleanupTimer);
      graph.cleanupTimer = undefined;
    }

    graph.input?.disconnect();
    graph.effectChain?.dispose();
    drone.graphs.delete(graph);

    if (drone.currentGraph === graph) {
      drone.currentGraph = undefined;
    }
  }

  function retainDroneEffectGraph(graph: DroneEffectGraph) {
    if (graph.cleanupTimer !== undefined) {
      window.clearTimeout(graph.cleanupTimer);
      graph.cleanupTimer = undefined;
    }

    graph.refCount += 1;
  }

  function releaseDroneEffectGraph(
    drone: ActiveDrone,
    graph: DroneEffectGraph,
  ) {
    if (graph.disposed) {
      return;
    }

    graph.refCount = Math.max(0, graph.refCount - 1);

    if (graph.refCount > 0 || graph.cleanupTimer !== undefined) {
      return;
    }

    graph.cleanupTimer = window.setTimeout(
      () => {
        if (graph.refCount === 0) {
          disposeDroneEffectGraph(drone, graph);
        }
      },
      (graph.tailSeconds + CLEANUP_DELAY_SECONDS) * 1000,
    );
  }

  function createDroneEffectGraph(drone: ActiveDrone, preset: AudioPreset) {
    const effects = preset.voice.insertEffects ?? [];
    const { perVoiceEffects, sharedEffects } =
      partitionDroneInsertEffects(effects);
    const input =
      sharedEffects.length > 0 ? drone.context.createGain() : undefined;
    const effectChain = input
      ? connectAudioEffectChain({
          context: drone.context,
          destination: drone.output,
          effects: sharedEffects,
          source: input,
        })
      : undefined;
    const graph: DroneEffectGraph = {
      cleanupTimer: undefined,
      disposed: false,
      effectChain,
      input,
      perVoiceEffects,
      presetId: preset.id,
      refCount: 0,
      tailSeconds: effectChain?.tailSeconds ?? 0,
      voiceDestination: input ?? drone.output,
    };

    drone.graphs.add(graph);
    drone.currentGraph = graph;
    return graph;
  }

  function getDroneEffectGraph(drone: ActiveDrone, preset: AudioPreset) {
    const currentGraph = drone.currentGraph;

    if (
      currentGraph &&
      !currentGraph.disposed &&
      currentGraph.presetId === preset.id
    ) {
      if (currentGraph.cleanupTimer !== undefined) {
        window.clearTimeout(currentGraph.cleanupTimer);
        currentGraph.cleanupTimer = undefined;
      }

      return currentGraph;
    }

    return createDroneEffectGraph(drone, preset);
  }

  function warmPresetWaves(context: AudioContext) {
    Object.values(audioPresets).forEach((preset) => {
      WARMUP_MIDI_NOTES.forEach((midiNote) => {
        const voiceConfig = resolveHarmonicVoiceConfig(preset.voice, midiNote);

        if (canUseNativeSineOscillator(voiceConfig.partials)) {
          return;
        }

        harmonicWaveCache.getPeriodicWave(context, voiceConfig.partials);
      });
    });
  }

  function primeContext(context: AudioContext) {
    const destination = getAudioMixer(context).getInput(DEFAULT_AUDIO_USE);

    if (primedContext === context) {
      return;
    }

    primedContext = context;
    warmPresetWaves(context);

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startTime = context.currentTime;
    const stopTime = startTime + SILENT_UNLOCK_PULSE_SECONDS;

    gain.gain.setValueAtTime(0, startTime);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(startTime);
    oscillator.stop(stopTime);

    window.setTimeout(
      () => {
        oscillator.disconnect();
        gain.disconnect();
      },
      (SILENT_UNLOCK_PULSE_SECONDS + CLEANUP_DELAY_SECONDS) * 1000,
    );
  }

  function scheduleVoiceCleanup(voice: ActiveVoice, cleanupTime: number) {
    const context = voice.envelope.context;
    const cleanupTimeWithTail = cleanupTime + voice.tailSeconds;
    const delaySeconds =
      Math.max(0, cleanupTimeWithTail - context.currentTime) +
      CLEANUP_DELAY_SECONDS;

    window.setTimeout(() => {
      voice.disconnect();
      activeVoices.delete(voice.handle);
      activeVoiceStartTimes.delete(voice.handle);
    }, delaySeconds * 1000);
  }

  function createVoice({
    context,
    destination,
    frequency,
    insertEffects,
    midiNote,
    minimumAttackSeconds,
    minimumReleaseSeconds,
    onDisconnect,
    preset,
    startTime,
    tailSeconds,
    use,
    velocity,
  }: {
    context: AudioContext;
    destination?: AudioNode;
    frequency: number;
    insertEffects?: readonly VoiceInsertEffectConfig[];
    midiNote: number;
    minimumAttackSeconds?: number;
    minimumReleaseSeconds?: number;
    onDisconnect?: () => void;
    preset: AudioPreset;
    startTime: number;
    tailSeconds?: number;
    use: AudioUse;
    velocity: number | undefined;
  }) {
    const handle = `voice-${nextVoiceId++}` as AudioVoiceHandle;
    const voice = createHarmonicVoice({
      context,
      destination: destination ?? getAudioMixer(context).getInput(use),
      frequency,
      getPeriodicWave: harmonicWaveCache.getPeriodicWave,
      handle,
      insertEffects,
      midiNote,
      minimumAttackSeconds,
      minimumReleaseSeconds,
      onDisconnect: () => {
        emitVoiceEnd(handle);
        activeVoices.delete(handle);
        activeVoiceStartTimes.delete(handle);
        playbackGroups.forEach((group) => group.voices.delete(handle));
        onDisconnect?.();
      },
      onEnded: (endedVoice, endTime) => {
        emitVoiceEnd(endedVoice.handle);
        scheduleVoiceCleanup(endedVoice, endTime);
      },
      preset,
      startTime,
      tailSeconds,
      velocity,
    });

    if (!voice) {
      return undefined;
    }

    activeVoices.set(handle, voice);
    activeVoiceStartTimes.set(handle, startTime);
    return voice;
  }

  function playNoteWithContext(
    context: AudioContext,
    request: PlayNoteRequest,
    requestedStartTime = context.currentTime,
  ) {
    const use = request.use ?? DEFAULT_AUDIO_USE;
    const preset = resolveAudioPreset(
      request.presetId,
      getDefaultAudioPresetId(use),
    );
    const durationSeconds = Math.max(
      MIN_NOTE_DURATION_SECONDS,
      normalizePositiveNumber(
        request.durationSeconds ?? preset.defaultDurationSeconds,
        MIN_NOTE_DURATION_SECONDS,
      ),
    );
    const startTime = Math.max(context.currentTime, requestedStartTime);
    const voice = createVoice({
      context,
      frequency: midiToFrequency(request.midiNote, request.concertPitchHz),
      midiNote: request.midiNote,
      preset,
      startTime,
      use,
      velocity: request.velocity,
    });

    if (!voice) {
      return undefined;
    }

    const minimumRampSeconds = getOneShotMinimumRampSeconds(context);

    scheduleOneShotEnvelope({
      durationSeconds,
      envelope: preset.voice.envelope,
      minimumAttackSeconds: minimumRampSeconds,
      minimumReleaseSeconds: minimumRampSeconds,
      param: voice.envelope.gain,
      peakGain: voice.peakGain,
      startTime,
    });
    voice.getGainAtTime = (sampleTime) =>
      getOneShotEnvelopeGainAtTime({
        durationSeconds,
        envelope: preset.voice.envelope,
        minimumAttackSeconds: minimumRampSeconds,
        minimumReleaseSeconds: minimumRampSeconds,
        peakGain: voice.peakGain,
        sampleTime,
        startTime,
      });

    const stopTime = startTime + durationSeconds;
    voice.scheduleStop(stopTime + getVoiceStopSilenceSeconds(context));

    return voice.handle;
  }

  function getOutputClock(context: AudioContext): AudioClockSnapshot {
    const outputTimestamp = context.getOutputTimestamp?.();
    const outputContextTime = outputTimestamp?.contextTime;
    const outputPerformanceTime = outputTimestamp?.performanceTime;

    if (
      typeof outputContextTime === "number" &&
      Number.isFinite(outputContextTime) &&
      typeof outputPerformanceTime === "number" &&
      Number.isFinite(outputPerformanceTime)
    ) {
      return {
        contextTime: outputContextTime,
        performanceTime: outputPerformanceTime,
      };
    }

    return {
      contextTime: context.currentTime,
      performanceTime:
        typeof performance === "undefined" ? 0 : performance.now(),
    };
  }

  function cancelPlaybackGroup(
    handle: PlaybackGroupHandle,
    releaseSeconds = DEFAULT_GROUP_RELEASE_SECONDS,
  ) {
    const group = playbackGroups.get(handle);
    const context = getRunningAudioContext();

    if (!group) {
      return;
    }

    playbackGroups.delete(handle);
    group.clicks.forEach((click) => {
      click.stop();
      click.disconnect();
    });
    group.voices.forEach((voiceHandle) => {
      const voice = activeVoices.get(voiceHandle);

      if (!voice) {
        return;
      }

      const startTime = activeVoiceStartTimes.get(voiceHandle) ?? 0;

      if (!context || startTime > context.currentTime) {
        voice.scheduleStop(Math.max(startTime, context?.currentTime ?? 0));
        voice.disconnect();
        return;
      }

      voice.stop({
        releaseSeconds,
        stopTime: context.currentTime + getScheduleLookaheadSeconds(context),
      });
    });
  }

  function normalizeDroneNotes(notes: readonly DroneNoteRequest[]) {
    const notesById = new Map<string, DroneNoteRequest>();

    notes.forEach((note) => {
      if (note.id !== "" && isPlayableMidiNote(note.midiNote)) {
        notesById.set(note.id, note);
      }
    });

    return notesById;
  }

  function createDroneVoice({
    attackSeconds = DRONE_MIN_ATTACK_SECONDS,
    drone,
    graph,
    note,
    preset,
    startTime,
  }: {
    attackSeconds?: number;
    drone: ActiveDrone;
    graph: DroneEffectGraph;
    note: DroneNoteRequest;
    preset: AudioPreset;
    startTime: number;
  }) {
    const activeDroneVoiceRef: {
      current?: ActiveDroneVoice;
    } = {};
    const voice = createVoice({
      context: drone.context,
      destination: graph.voiceDestination,
      frequency: midiToFrequency(note.midiNote, drone.concertPitchHz),
      insertEffects: graph.perVoiceEffects,
      midiNote: note.midiNote,
      minimumAttackSeconds: attackSeconds,
      minimumReleaseSeconds: DRONE_MIN_RELEASE_SECONDS,
      onDisconnect: () => {
        if (
          activeDroneVoiceRef.current &&
          drone.voices.get(note.id) === activeDroneVoiceRef.current
        ) {
          drone.voices.delete(note.id);
        }

        releaseDroneEffectGraph(drone, graph);
      },
      preset,
      startTime,
      use: drone.use,
      velocity: note.velocity,
    });

    if (!voice) {
      return undefined;
    }

    const activeDroneVoice = { request: note, voice };
    activeDroneVoiceRef.current = activeDroneVoice;
    retainDroneEffectGraph(graph);
    drone.voices.set(note.id, activeDroneVoice);
    scheduleAttackDecayEnvelope({
      envelope: preset.voice.envelope,
      minimumAttackSeconds: attackSeconds,
      param: voice.envelope.gain,
      peakGain: voice.peakGain,
      startTime,
    });

    return activeDroneVoice;
  }

  function stopDroneVoice(
    drone: ActiveDrone,
    noteId: string,
    options?: {
      releaseSeconds?: number;
      stopTime?: number;
    },
  ) {
    const activeDroneVoice = drone.voices.get(noteId);

    if (!activeDroneVoice) {
      return;
    }

    drone.voices.delete(noteId);
    activeDroneVoice.voice.stop(options);
  }

  function stopDroneVoices(
    drone: ActiveDrone,
    options?: {
      releaseSeconds?: number;
      stopTime?: number;
    },
  ) {
    [...drone.voices.keys()].forEach((noteId) =>
      stopDroneVoice(drone, noteId, options),
    );
  }

  function replaceDroneVoices({
    drone,
    notesById,
    preset,
    startTime,
  }: {
    drone: ActiveDrone;
    notesById: Map<string, DroneNoteRequest>;
    preset: AudioPreset;
    startTime: number;
  }) {
    const previousVoices = [...drone.voices.values()];

    drone.voices.clear();
    previousVoices.forEach(({ voice }) =>
      voice.stop({
        releaseSeconds: DRONE_PRESET_CROSSFADE_SECONDS,
        stopTime: startTime,
      }),
    );
    drone.currentGraph = undefined;
    drone.presetId = preset.id;

    if (notesById.size === 0) {
      return;
    }

    const graph = getDroneEffectGraph(drone, preset);

    notesById.forEach((note) => {
      createDroneVoice({
        attackSeconds: DRONE_PRESET_CROSSFADE_SECONDS,
        drone,
        graph,
        note,
        preset,
        startTime,
      });
    });
  }

  function reconcileDrone(drone: ActiveDrone, request: DroneRequest) {
    const notesById = normalizeDroneNotes(request.notes);
    const use = request.use ?? DEFAULT_DRONE_USE;
    const preset = resolveAudioPreset(
      request.presetId,
      getDefaultAudioPresetId(use),
    );
    const startTime =
      drone.context.currentTime + getScheduleLookaheadSeconds(drone.context);
    const presetChanged = drone.presetId !== preset.id;
    const useChanged = drone.use !== use;
    const concertPitchChanged = drone.concertPitchHz !== request.concertPitchHz;

    drone.concertPitchHz = request.concertPitchHz;

    if (useChanged) {
      drone.output.disconnect();
      drone.output.connect(getAudioMixer(drone.context).getInput(use));
      drone.use = use;
    }

    if (presetChanged) {
      replaceDroneVoices({
        drone,
        notesById,
        preset,
        startTime,
      });
      return;
    }

    drone.voices.forEach((activeVoice, noteId) => {
      const nextNote = notesById.get(noteId);

      if (!nextNote) {
        stopDroneVoice(drone, noteId, { stopTime: startTime });
        return;
      }

      const pitchChanged =
        nextNote.midiNote !== activeVoice.request.midiNote ||
        concertPitchChanged;

      if (pitchChanged) {
        activeVoice.voice.setFrequency(
          midiToFrequency(nextNote.midiNote, request.concertPitchHz),
          startTime,
          DRONE_PITCH_GLIDE_SECONDS,
        );
      }

      if (pitchChanged || nextNote.velocity !== activeVoice.request.velocity) {
        const levelGain = getHarmonicVoiceLevelGain({
          midiNote: nextNote.midiNote,
          preset,
          velocity: nextNote.velocity,
        });

        activeVoice.voice.setLevelGain(
          levelGain,
          startTime,
          pitchChanged ? DRONE_PITCH_GLIDE_SECONDS : DRONE_LEVEL_RAMP_SECONDS,
        );
      }

      activeVoice.request = nextNote;
    });

    const graph = [...notesById.keys()].some(
      (noteId) => !drone.voices.has(noteId),
    )
      ? getDroneEffectGraph(drone, preset)
      : undefined;

    notesById.forEach((note, noteId) => {
      if (!drone.voices.has(noteId) && graph) {
        createDroneVoice({
          drone,
          graph,
          note,
          preset,
          startTime,
        });
      }
    });
    drone.presetId = preset.id;
  }

  function createDroneWithContext(
    context: AudioContext,
    request: DroneRequest,
  ) {
    if (normalizeDroneNotes(request.notes).size === 0) {
      return undefined;
    }

    const use = request.use ?? DEFAULT_DRONE_USE;
    const preset = resolveAudioPreset(
      request.presetId,
      getDefaultAudioPresetId(use),
    );
    const output = context.createGain();
    const handle = `drone-${nextDroneId++}` as DroneHandle;
    const drone: ActiveDrone = {
      concertPitchHz: request.concertPitchHz,
      context,
      currentGraph: undefined,
      destroyed: false,
      graphs: new Set(),
      handle,
      output,
      presetId: preset.id,
      use,
      voices: new Map(),
    };

    output.gain.setValueAtTime(1, context.currentTime);
    output.connect(getAudioMixer(context).getInput(use));
    activeDrones.set(handle, drone);
    reconcileDrone(drone, request);

    return handle;
  }

  function destroyDrone(drone: ActiveDrone) {
    if (drone.destroyed) {
      return;
    }

    const maxReleaseSeconds = Math.max(
      DRONE_MIN_RELEASE_SECONDS,
      ...[...drone.voices.values()].map(({ voice }) =>
        Math.max(voice.releaseSeconds, DRONE_MIN_RELEASE_SECONDS),
      ),
    );
    const maxTailSeconds = Math.max(
      0,
      ...[...drone.graphs].map((graph) => graph.tailSeconds),
    );

    stopDroneVoices(drone);
    drone.destroyed = true;
    activeDrones.delete(drone.handle);

    const cleanupDelaySeconds =
      maxReleaseSeconds + maxTailSeconds + CLEANUP_DELAY_SECONDS * 2;

    window.setTimeout(() => {
      drone.graphs.forEach((graph) => disposeDroneEffectGraph(drone, graph));
      drone.output.disconnect();
    }, cleanupDelaySeconds * 1000);
  }

  function runWithReadyContext<T>(operation: (context: AudioContext) => T) {
    const runningContext = getRunningAudioContext();

    if (runningContext) {
      primeContext(runningContext);
      return Promise.resolve(operation(runningContext));
    }

    return getReadyAudioContext().then((context) => {
      if (!context) {
        return undefined;
      }

      primeContext(context);
      return operation(context);
    });
  }

  return {
    cancelPlaybackGroup: (handle, options) => {
      cancelPlaybackGroup(handle, options?.releaseSeconds);
    },
    createPlaybackGroup: () => {
      const handle =
        `playback-group-${nextPlaybackGroupId++}` as PlaybackGroupHandle;
      playbackGroups.set(handle, {
        clicks: new Set(),
        voices: new Set(),
      });
      return handle;
    },
    getCurrentTime: () => getRunningAudioContext()?.currentTime,
    getMasterAmbiencePresetId: () => masterAmbiencePresetId,
    getOutputClock: () => {
      const context = getRunningAudioContext();
      return context ? getOutputClock(context) : undefined;
    },
    isSupported: () => getAudioContextConstructor() !== undefined,
    prime: async () => {
      const context = await getReadyAudioContext();

      if (!context) {
        return false;
      }

      primeContext(context);
      return true;
    },
    playNote: (request: PlayNoteRequest) => {
      if (!isPlayableMidiNote(request.midiNote)) {
        return Promise.resolve(undefined);
      }

      return runWithReadyContext((context) =>
        playNoteWithContext(context, request),
      );
    },
    scheduleMetronomeClick: (request: ScheduleMetronomeClickRequest) => {
      const context = getRunningAudioContext();
      const group = playbackGroups.get(request.group);

      if (!context || !group || !Number.isFinite(request.startTime)) {
        return false;
      }

      const click = scheduleMetronomeClick({
        accent: request.accent === true,
        context,
        destination: getAudioMixer(context).getMetronomeInput(),
        onEnded: () => group.clicks.delete(click),
        startTime: Math.max(context.currentTime, request.startTime),
      });
      group.clicks.add(click);
      return true;
    },
    scheduleNote: (request: ScheduleNoteRequest) => {
      const context = getRunningAudioContext();
      const group = playbackGroups.get(request.group);

      if (
        !context ||
        !group ||
        !isPlayableMidiNote(request.midiNote) ||
        !Number.isFinite(request.startTime)
      ) {
        return undefined;
      }

      const voiceHandle = playNoteWithContext(
        context,
        request,
        request.startTime,
      );

      if (voiceHandle) {
        group.voices.add(voiceHandle);
      }

      return voiceHandle;
    },
    setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => {
      masterAmbiencePresetId = presetId;
      audioMixer?.setMasterAmbiencePresetId(presetId);
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
    subscribeToVoiceEnd: (handle, listener) => {
      if (!activeVoices.has(handle)) {
        let subscribed = true;
        queueMicrotask(() => {
          if (subscribed) {
            listener();
          }
        });
        return () => {
          subscribed = false;
        };
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
    createDrone: (request: DroneRequest) => {
      if (!request.notes.some((note) => isPlayableMidiNote(note.midiNote))) {
        return Promise.resolve(undefined);
      }

      return runWithReadyContext((context) =>
        createDroneWithContext(context, request),
      );
    },
    destroyDrone: (handle: DroneHandle) => {
      const drone = activeDrones.get(handle);

      if (!drone) {
        return;
      }

      destroyDrone(drone);
    },
    updateDrone: (handle: DroneHandle, request: DroneRequest) => {
      const drone = activeDrones.get(handle);

      if (!drone) {
        return false;
      }

      if (drone.context.state === "closed") {
        clearContextReferences();
        return false;
      }

      reconcileDrone(drone, request);
      return true;
    },
    stopAll: () => {
      [...playbackGroups.keys()].forEach((handle) =>
        cancelPlaybackGroup(handle),
      );
      activeDrones.forEach((drone) => stopDroneVoices(drone));
      activeVoices.forEach((voice) => voice.stop());
      stopAllListeners.forEach((listener) => listener());
    },
  };
}

export const musoAudioEngine = createWebAudioEngine();
