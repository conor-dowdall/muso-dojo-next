"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDefaultAudioPresetId,
  musoAudioEngine,
  type AudioPresetId,
  type DroneHandle,
} from "@/audio";

const DRONE_BASE_VELOCITY = 0.78;
const DRONE_HIGH_BALANCE_START_MIDI = 60;
const DRONE_HIGH_BALANCE_END_MIDI = 84;
const DRONE_HIGH_BALANCE_MIN_SCALE = 0.72;

export interface DroneNotePlaybackNote {
  audioPresetId?: AudioPresetId;
  interval: number;
  midi: number;
  velocity?: number;
}

interface ActiveDroneNote<THandle> {
  audioPresetId?: AudioPresetId;
  handle?: THandle;
  midi: number;
  token: number;
  velocity?: number;
}

interface DroneNotePlaybackControllerOptions<THandle> {
  onActiveIntervalsChange?: (activeIntervals: number[]) => void;
  start: (note: DroneNotePlaybackNote) => Promise<THandle | undefined>;
  stop: (handle: THandle) => void;
}

interface UseDroneNotePlaybackOptions {
  audioPresetId?: AudioPresetId;
  notes: readonly DroneNotePlaybackNote[];
}

function getSortedIntervals<THandle>(
  activeNotes: Map<number, ActiveDroneNote<THandle>>,
) {
  return [...activeNotes.keys()].sort((left, right) => left - right);
}

function activeNoteMatches<THandle>(
  current: ActiveDroneNote<THandle> | undefined,
  note: DroneNotePlaybackNote,
) {
  return (
    current?.audioPresetId === note.audioPresetId &&
    current?.midi === note.midi &&
    current?.velocity === note.velocity
  );
}

export function getDronePlaybackVelocity(midi: number) {
  if (midi <= DRONE_HIGH_BALANCE_START_MIDI) {
    return DRONE_BASE_VELOCITY;
  }

  const progress = Math.min(
    1,
    Math.max(
      0,
      (midi - DRONE_HIGH_BALANCE_START_MIDI) /
        (DRONE_HIGH_BALANCE_END_MIDI - DRONE_HIGH_BALANCE_START_MIDI),
    ),
  );
  const scale = 1 - progress * (1 - DRONE_HIGH_BALANCE_MIN_SCALE);

  return DRONE_BASE_VELOCITY * scale;
}

function createPlaybackNote(
  note: DroneNotePlaybackNote,
  audioPresetId: AudioPresetId,
): DroneNotePlaybackNote {
  return {
    ...note,
    audioPresetId,
    velocity: getDronePlaybackVelocity(note.midi),
  };
}

export function createDroneNotePlaybackController<THandle>({
  onActiveIntervalsChange,
  start,
  stop,
}: DroneNotePlaybackControllerOptions<THandle>) {
  const activeNotes = new Map<number, ActiveDroneNote<THandle>>();
  let startOperation = start;
  let stopOperation = stop;

  const emitActiveIntervals = () => {
    onActiveIntervalsChange?.(getSortedIntervals(activeNotes));
  };

  const requestHandle = async (note: DroneNotePlaybackNote, token: number) => {
    try {
      const handle = await startOperation(note);
      const current = activeNotes.get(note.interval);

      if (!activeNoteMatches(current, note) || current?.token !== token) {
        if (handle !== undefined) {
          stopOperation(handle);
        }
        return;
      }

      if (handle === undefined) {
        activeNotes.delete(note.interval);
        emitActiveIntervals();
        return;
      }

      activeNotes.set(note.interval, { ...current, handle });
    } catch {
      const current = activeNotes.get(note.interval);

      if (current?.token === token) {
        activeNotes.delete(note.interval);
        emitActiveIntervals();
      }
    }
  };

  const startNote = async (note: DroneNotePlaybackNote) => {
    const current = activeNotes.get(note.interval);

    if (activeNoteMatches(current, note)) {
      return;
    }

    if (current?.handle !== undefined) {
      stopOperation(current.handle);
    }

    const token = (current?.token ?? 0) + 1;
    activeNotes.set(note.interval, {
      audioPresetId: note.audioPresetId,
      midi: note.midi,
      token,
      velocity: note.velocity,
    });

    if (!current) {
      emitActiveIntervals();
    }

    await requestHandle(note, token);
  };

  const stopNote = (interval: number) => {
    const current = activeNotes.get(interval);

    if (!current) {
      return;
    }

    activeNotes.delete(interval);

    if (current.handle !== undefined) {
      stopOperation(current.handle);
    }

    emitActiveIntervals();
  };

  return {
    dispose: () => {
      const intervals = getSortedIntervals(activeNotes);

      intervals.forEach((interval) => {
        const current = activeNotes.get(interval);

        if (current?.handle !== undefined) {
          stopOperation(current.handle);
        }

        activeNotes.delete(interval);
      });
    },
    getActiveIntervals: () => getSortedIntervals(activeNotes),
    reconcileNotes: (notes: readonly DroneNotePlaybackNote[]) => {
      const notesByInterval = new Map(
        notes.map((note) => [note.interval, note]),
      );

      activeNotes.forEach((activeNote, interval) => {
        const nextNote = notesByInterval.get(interval);

        if (!nextNote) {
          stopNote(interval);
          return;
        }

        if (!activeNoteMatches(activeNote, nextNote)) {
          void startNote(nextNote);
        }
      });
    },
    setOperations: (operations: {
      start: (note: DroneNotePlaybackNote) => Promise<THandle | undefined>;
      stop: (handle: THandle) => void;
    }) => {
      startOperation = operations.start;
      stopOperation = operations.stop;
    },
    startNote,
    stopAll: () => {
      const intervals = getSortedIntervals(activeNotes);
      intervals.forEach(stopNote);
    },
    stopNote,
    toggleNote: (note: DroneNotePlaybackNote) => {
      if (activeNotes.has(note.interval)) {
        stopNote(note.interval);
        return;
      }

      void startNote(note);
    },
  };
}

export function useDroneNotePlayback({
  audioPresetId,
  notes,
}: UseDroneNotePlaybackOptions) {
  const resolvedAudioPresetId =
    audioPresetId ?? getDefaultAudioPresetId("drone");
  const playbackNotes = useMemo(
    () => notes.map((note) => createPlaybackNote(note, resolvedAudioPresetId)),
    [notes, resolvedAudioPresetId],
  );
  const [activeIntervals, setActiveIntervals] = useState<number[]>([]);
  const [controller] = useState(() =>
    createDroneNotePlaybackController<DroneHandle>({
      onActiveIntervalsChange: setActiveIntervals,
      start: (note) =>
        musoAudioEngine.startDrone({
          midiNotes: [note.midi],
          presetId: note.audioPresetId,
          use: "drone",
          velocity: note.velocity,
        }),
      stop: (handle) => musoAudioEngine.stopDrone(handle),
    }),
  );

  const start = useCallback(
    (note: DroneNotePlaybackNote) =>
      musoAudioEngine.startDrone({
        midiNotes: [note.midi],
        presetId: note.audioPresetId,
        use: "drone",
        velocity: note.velocity,
      }),
    [],
  );
  const stop = useCallback(
    (handle: DroneHandle) => musoAudioEngine.stopDrone(handle),
    [],
  );

  useEffect(() => {
    controller.setOperations({ start, stop });
  }, [controller, start, stop]);

  useEffect(() => {
    controller.reconcileNotes(playbackNotes);
  }, [controller, playbackNotes]);

  useEffect(
    () => () => {
      controller.dispose();
    },
    [controller],
  );

  return {
    activeIntervals,
    isNoteActive: (interval: number) => activeIntervals.includes(interval),
    toggleNote: (note: DroneNotePlaybackNote) =>
      controller.toggleNote(createPlaybackNote(note, resolvedAudioPresetId)),
  };
}
