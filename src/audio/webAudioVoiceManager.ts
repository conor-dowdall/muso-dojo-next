import {
  getOneShotEnvelopeGainAtTime,
  scheduleOneShotEnvelope,
} from "./envelope";
import {
  getOneShotMinimumRampSeconds,
  getScheduleLookaheadSeconds,
} from "./webAudioContextLifecycle";
import {
  scheduleMetronomeClick,
  type ScheduledMetronomeClick,
} from "./metronome";
import { type AudioMixer } from "./mixer";
import { normalizePositiveNumber } from "./numeric";
import { isPlayableMidiNote, midiToFrequency } from "./pitch";
import { getDefaultAudioPresetId, resolveAudioPreset } from "./presets";
import {
  type AudioPreset,
  type AudioUse,
  type AudioVoiceHandle,
  type HarmonicPartialConfig,
  type PlayNoteRequest,
  type PlaybackGroupHandle,
  type ScheduleMetronomeClickRequest,
  type ScheduleNoteRequest,
  type VoiceInsertEffectConfig,
} from "./types";
import {
  createHarmonicVoice,
  getVoiceStopSilenceSeconds,
  type ActiveVoice,
} from "./voice";

const DEFAULT_AUDIO_USE = "preview" satisfies AudioUse;
const MIN_NOTE_DURATION_SECONDS = 0.02;
const CLEANUP_DELAY_SECONDS = 0.05;
const DEFAULT_GROUP_RELEASE_SECONDS = 0.035;

interface ActivePlaybackGroup {
  clicks: Set<ScheduledMetronomeClick>;
  voices: Set<AudioVoiceHandle>;
}

export interface CreateManagedVoiceOptions {
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
}

export function createWebAudioVoiceManager({
  getAudioMixer,
  getPeriodicWave,
  getRunningAudioContext,
}: {
  getAudioMixer: (context: AudioContext) => AudioMixer;
  getPeriodicWave: (
    context: AudioContext,
    partials: readonly HarmonicPartialConfig[],
  ) => PeriodicWave | undefined;
  getRunningAudioContext: () => AudioContext | undefined;
}) {
  let nextVoiceId = 0;
  let nextPlaybackGroupId = 0;
  const activeVoices = new Map<AudioVoiceHandle, ActiveVoice>();
  const activeVoiceStartTimes = new Map<AudioVoiceHandle, number>();
  const playbackGroups = new Map<PlaybackGroupHandle, ActivePlaybackGroup>();
  const voiceEndListeners = new Map<AudioVoiceHandle, Set<() => void>>();

  function emitVoiceEnd(handle: AudioVoiceHandle) {
    const listeners = voiceEndListeners.get(handle);

    if (!listeners) {
      return;
    }

    voiceEndListeners.delete(handle);
    listeners.forEach((listener) => listener());
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
  }: CreateManagedVoiceOptions) {
    const handle = `voice-${nextVoiceId++}` as AudioVoiceHandle;
    const voice = createHarmonicVoice({
      context,
      destination: destination ?? getAudioMixer(context).getInput(use),
      frequency,
      getPeriodicWave,
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
    requestedStartTime?: number,
  ) {
    const use = request.use ?? DEFAULT_AUDIO_USE;
    const preset = resolveAudioPreset(
      request.presetId,
      getDefaultAudioPresetId(use),
    );
    const requestedDurationSeconds = Math.max(
      MIN_NOTE_DURATION_SECONDS,
      normalizePositiveNumber(
        request.durationSeconds ?? preset.defaultDurationSeconds,
        MIN_NOTE_DURATION_SECONDS,
      ),
    );
    const currentTime = context.currentTime;
    const scheduledStartTime = requestedStartTime ?? currentTime;
    const minimumStartTime =
      requestedStartTime === undefined
        ? currentTime
        : currentTime + getScheduleLookaheadSeconds(context);
    const startTime = Math.max(minimumStartTime, scheduledStartTime);
    const durationSeconds =
      requestedDurationSeconds - Math.max(0, startTime - scheduledStartTime);

    if (durationSeconds < MIN_NOTE_DURATION_SECONDS) {
      return undefined;
    }

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

  function cancelAllPlaybackGroups() {
    [...playbackGroups.keys()].forEach((handle) => cancelPlaybackGroup(handle));
  }

  function reset() {
    playbackGroups.forEach((group) => {
      group.clicks.forEach((click) => {
        click.stop();
        click.disconnect();
      });
    });
    activeVoices.forEach((voice) => emitVoiceEnd(voice.handle));
    activeVoices.clear();
    activeVoiceStartTimes.clear();
    playbackGroups.clear();
  }

  return {
    cancelAllPlaybackGroups,
    cancelPlaybackGroup,
    createPlaybackGroup: () => {
      const handle =
        `playback-group-${nextPlaybackGroupId++}` as PlaybackGroupHandle;
      playbackGroups.set(handle, {
        clicks: new Set(),
        voices: new Set(),
      });
      return handle;
    },
    createVoice,
    playNoteWithContext,
    reset,
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
    stopAllVoices: () => {
      activeVoices.forEach((voice) => voice.stop());
    },
    subscribeToVoiceEnd: (handle: AudioVoiceHandle, listener: () => void) => {
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
  };
}

export type WebAudioVoiceManager = ReturnType<
  typeof createWebAudioVoiceManager
>;
