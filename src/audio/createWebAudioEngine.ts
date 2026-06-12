import { createHarmonicWaveCache } from "./harmonicWave";
import { isPlayableMidiNote } from "./pitch";
import {
  type AudioEngine,
  type DroneHandle,
  type DroneRequest,
  type MasterAmbiencePresetId,
  type PlayNoteRequest,
} from "./types";
import { createWebAudioContextLifecycle } from "./webAudioContextLifecycle";
import { createWebAudioDroneManager } from "./webAudioDroneManager";
import {
  createWebAudioVoiceManager,
  type WebAudioVoiceManager,
} from "./webAudioVoiceManager";

export function createWebAudioEngine(): AudioEngine {
  const resetListeners = new Set<() => void>();
  const stopAllListeners = new Set<() => void>();
  const harmonicWaveCache = createHarmonicWaveCache();
  const resetTargets: {
    drone?: ReturnType<typeof createWebAudioDroneManager>;
    voices?: WebAudioVoiceManager;
  } = {};
  const contextLifecycle = createWebAudioContextLifecycle({
    getPeriodicWave: harmonicWaveCache.getPeriodicWave,
    onBeforeReset: () => {
      try {
        resetTargets.drone?.reset();
      } catch {
        // The browser may already have torn down the drone graph.
      }

      try {
        resetTargets.voices?.reset();
      } catch {
        // The browser may already have torn down active voices.
      }
    },
    onReset: () => {
      resetListeners.forEach((listener) => listener());
    },
  });
  const managedVoices = createWebAudioVoiceManager({
    getAudioMixer: contextLifecycle.getAudioMixer,
    getPeriodicWave: harmonicWaveCache.getPeriodicWave,
    getRunningAudioContext: contextLifecycle.getRunningAudioContext,
  });
  const managedDrones = createWebAudioDroneManager({
    createVoice: managedVoices.createVoice,
    getAudioMixer: contextLifecycle.getAudioMixer,
  });

  resetTargets.voices = managedVoices;
  resetTargets.drone = managedDrones;

  return {
    cancelPlaybackGroup: (handle, options) => {
      managedVoices.cancelPlaybackGroup(handle, options?.releaseSeconds);
    },
    createPlaybackGroup: managedVoices.createPlaybackGroup,
    getCurrentTime: () =>
      contextLifecycle.getRunningAudioContext()?.currentTime,
    getMasterAmbiencePresetId: contextLifecycle.getMasterAmbiencePresetId,
    getOutputClock: () => {
      const context = contextLifecycle.getRunningAudioContext();
      return context ? contextLifecycle.getOutputClock(context) : undefined;
    },
    isSupported: contextLifecycle.isSupported,
    prime: async () => {
      const context = await contextLifecycle.getReadyAudioContext();

      if (!context) {
        return false;
      }

      contextLifecycle.primeContext(context);
      return true;
    },
    playNote: (request: PlayNoteRequest) => {
      if (!isPlayableMidiNote(request.midiNote)) {
        return Promise.resolve(undefined);
      }

      return contextLifecycle.runWithReadyContext((context) =>
        managedVoices.playNoteWithContext(context, request),
      );
    },
    scheduleMetronomeClick: managedVoices.scheduleMetronomeClick,
    scheduleNote: managedVoices.scheduleNote,
    setMasterAmbiencePresetId: (presetId: MasterAmbiencePresetId) => {
      contextLifecycle.setMasterAmbiencePresetId(presetId);
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
    subscribeToVoiceEnd: managedVoices.subscribeToVoiceEnd,
    createDrone: (request: DroneRequest) => {
      if (!request.notes.some((note) => isPlayableMidiNote(note.midiNote))) {
        return Promise.resolve(undefined);
      }

      return contextLifecycle.runWithReadyContext((context) =>
        managedDrones.createDrone(context, request),
      );
    },
    destroyDrone: (handle: DroneHandle) => {
      managedDrones.destroyDrone(handle);
    },
    updateDrone: (handle: DroneHandle, request: DroneRequest) => {
      const context = managedDrones.getContext(handle);

      if (!context) {
        return false;
      }

      if (context.state === "closed") {
        contextLifecycle.clearContextReferences();
        return false;
      }

      return managedDrones.updateDrone(handle, request);
    },
    stopAll: () => {
      managedVoices.cancelAllPlaybackGroups();
      managedDrones.stopAll();
      managedVoices.stopAllVoices();
      stopAllListeners.forEach((listener) => listener());
    },
  };
}

export const musoAudioEngine = createWebAudioEngine();
