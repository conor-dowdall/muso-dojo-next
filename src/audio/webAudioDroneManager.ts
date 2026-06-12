import {
  connectAudioEffectChain,
  type ConnectedAudioEffectChain,
} from "./effects";
import { scheduleAttackDecayEnvelope } from "./envelope";
import { getScheduleLookaheadSeconds } from "./webAudioContextLifecycle";
import { type AudioMixer } from "./mixer";
import { isPlayableMidiNote, midiToFrequency } from "./pitch";
import { getDefaultAudioPresetId, resolveAudioPreset } from "./presets";
import {
  type AudioPreset,
  type AudioUse,
  type DroneHandle,
  type DroneNoteRequest,
  type DroneRequest,
  type VoiceInsertEffectConfig,
} from "./types";
import { getHarmonicVoiceLevelGain, type ActiveVoice } from "./voice";
import { type WebAudioVoiceManager } from "./webAudioVoiceManager";

const DEFAULT_DRONE_USE = "drone" satisfies AudioUse;
const CLEANUP_DELAY_SECONDS = 0.05;
const DRONE_MIN_ATTACK_SECONDS = 0.012;
const DRONE_MIN_RELEASE_SECONDS = 0.04;
const DRONE_LEVEL_RAMP_SECONDS = 0.035;
const DRONE_PITCH_GLIDE_SECONDS = 0.075;
const DRONE_PRESET_CROSSFADE_SECONDS = 0.09;

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

export function createWebAudioDroneManager({
  createVoice,
  getAudioMixer,
}: {
  createVoice: WebAudioVoiceManager["createVoice"];
  getAudioMixer: (context: AudioContext) => AudioMixer;
}) {
  let nextDroneId = 0;
  const activeDrones = new Map<DroneHandle, ActiveDrone>();

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

  function createDrone(context: AudioContext, request: DroneRequest) {
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

  function reset() {
    activeDrones.forEach((drone) => {
      drone.destroyed = true;
      drone.voices.forEach(({ voice }) => voice.disconnect());
      [...drone.graphs].forEach((graph) =>
        disposeDroneEffectGraph(drone, graph),
      );
      drone.output.disconnect();
    });
    activeDrones.clear();
  }

  return {
    createDrone,
    destroyDrone: (handle: DroneHandle) => {
      const drone = activeDrones.get(handle);

      if (drone) {
        destroyDrone(drone);
      }
    },
    getContext: (handle: DroneHandle) => activeDrones.get(handle)?.context,
    reset,
    stopAll: () => {
      activeDrones.forEach((drone) => stopDroneVoices(drone));
    },
    updateDrone: (handle: DroneHandle, request: DroneRequest) => {
      const drone = activeDrones.get(handle);

      if (!drone) {
        return false;
      }

      reconcileDrone(drone, request);
      return true;
    },
  };
}
