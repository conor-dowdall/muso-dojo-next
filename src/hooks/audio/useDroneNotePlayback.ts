"use client";

import { useCallback, useEffect, useState } from "react";
import { musoAudioEngine, type DroneHandle } from "@/audio";

export interface DroneNotePlaybackNote {
  interval: number;
  midi: number;
}

interface ActiveDroneNote<THandle> {
  handle?: THandle;
  midi: number;
  token: number;
}

interface DroneNotePlaybackControllerOptions<THandle> {
  onActiveIntervalsChange?: (activeIntervals: number[]) => void;
  start: (note: DroneNotePlaybackNote) => Promise<THandle | undefined>;
  stop: (handle: THandle) => void;
}

interface UseDroneNotePlaybackOptions {
  notes: readonly DroneNotePlaybackNote[];
}

function getSortedIntervals<THandle>(
  activeNotes: Map<number, ActiveDroneNote<THandle>>,
) {
  return [...activeNotes.keys()].sort((left, right) => left - right);
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

      if (!current || current.token !== token || current.midi !== note.midi) {
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

    if (current?.midi === note.midi) {
      return;
    }

    if (current?.handle !== undefined) {
      stopOperation(current.handle);
    }

    const token = (current?.token ?? 0) + 1;
    activeNotes.set(note.interval, {
      midi: note.midi,
      token,
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

        if (nextNote.midi !== activeNote.midi) {
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

export function useDroneNotePlayback({ notes }: UseDroneNotePlaybackOptions) {
  const [activeIntervals, setActiveIntervals] = useState<number[]>([]);
  const [controller] = useState(() =>
    createDroneNotePlaybackController<DroneHandle>({
      onActiveIntervalsChange: setActiveIntervals,
      start: (note) =>
        musoAudioEngine.startDrone({
          midiNotes: [note.midi],
          use: "drone",
          velocity: 0.78,
        }),
      stop: (handle) => musoAudioEngine.stopDrone(handle),
    }),
  );

  const start = useCallback(
    (note: DroneNotePlaybackNote) =>
      musoAudioEngine.startDrone({
        midiNotes: [note.midi],
        use: "drone",
        velocity: 0.78,
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
    controller.reconcileNotes(notes);
  }, [controller, notes]);

  useEffect(
    () => () => {
      controller.dispose();
    },
    [controller],
  );

  return {
    activeIntervals,
    isNoteActive: (interval: number) => activeIntervals.includes(interval),
    toggleNote: (note: DroneNotePlaybackNote) => controller.toggleNote(note),
  };
}
