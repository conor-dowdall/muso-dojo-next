"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDefaultAudioPresetId,
  musoAudioEngine,
  type AudioPresetId,
  type DroneHandle,
  type DroneRequest,
} from "@/audio";

const DRONE_BASE_VELOCITY = 0.78;
const DRONE_BALANCE_REFERENCE_INTERVAL = 24;
const DRONE_ABOVE_ROOT_INITIAL_SCALE = 0.25;
const DRONE_ABOVE_ROOT_MIN_SCALE = 0.02;

export interface DroneNotePlaybackNote {
  audioPresetId?: AudioPresetId;
  interval: number;
  midi: number;
  velocity?: number;
}

interface DroneNotePlaybackControllerOptions<THandle> {
  create: (
    notes: readonly DroneNotePlaybackNote[],
  ) => Promise<THandle | undefined>;
  destroy: (handle: THandle) => void;
  onActiveIntervalsChange?: (activeIntervals: number[]) => void;
  update: (
    handle: THandle,
    notes: readonly DroneNotePlaybackNote[],
  ) => boolean | void;
}

interface UseDroneNotePlaybackOptions {
  audioPresetId?: AudioPresetId;
  notes: readonly DroneNotePlaybackNote[];
}

function getSortedNotes(activeNotes: Map<number, DroneNotePlaybackNote>) {
  return [...activeNotes.values()].sort(
    (left, right) => left.interval - right.interval,
  );
}

function getSortedIntervals(activeNotes: Map<number, DroneNotePlaybackNote>) {
  return getSortedNotes(activeNotes).map((note) => note.interval);
}

function notesMatch(
  current: DroneNotePlaybackNote | undefined,
  next: DroneNotePlaybackNote,
) {
  return (
    current?.audioPresetId === next.audioPresetId &&
    current?.midi === next.midi &&
    current?.velocity === next.velocity
  );
}

export function getDronePlaybackVelocity({
  interval,
}: Pick<DroneNotePlaybackNote, "interval">) {
  const semitonesAboveRoot = Math.max(0, interval);

  if (semitonesAboveRoot === 0) {
    return DRONE_BASE_VELOCITY;
  }

  const progress = Math.min(
    1,
    semitonesAboveRoot / DRONE_BALANCE_REFERENCE_INTERVAL,
  );
  const scale =
    DRONE_ABOVE_ROOT_INITIAL_SCALE -
    progress * (DRONE_ABOVE_ROOT_INITIAL_SCALE - DRONE_ABOVE_ROOT_MIN_SCALE);

  return DRONE_BASE_VELOCITY * scale;
}

function createPlaybackNote(
  note: DroneNotePlaybackNote,
  audioPresetId: AudioPresetId,
): DroneNotePlaybackNote {
  return {
    ...note,
    audioPresetId,
    velocity: getDronePlaybackVelocity(note),
  };
}

export function createDroneNotePlaybackController<THandle>({
  create,
  destroy,
  onActiveIntervalsChange,
  update,
}: DroneNotePlaybackControllerOptions<THandle>) {
  const activeNotes = new Map<number, DroneNotePlaybackNote>();
  let createOperation = create;
  let destroyOperation = destroy;
  let updateOperation = update;
  let handle: THandle | undefined;
  let pendingHandle: Promise<THandle | undefined> | undefined;
  let disposed = false;
  let lifecycleRevision = 0;
  let revision = 0;

  const emitActiveIntervals = () => {
    onActiveIntervalsChange?.(getSortedIntervals(activeNotes));
  };

  const sync = () => {
    revision += 1;
    const notes = getSortedNotes(activeNotes);

    if (handle !== undefined) {
      const didUpdate = updateOperation(handle, notes);

      if (didUpdate === false) {
        handle = undefined;
        return sync();
      }

      return Promise.resolve();
    }

    if (pendingHandle || notes.length === 0) {
      return pendingHandle ?? Promise.resolve();
    }

    const createLifecycleRevision = lifecycleRevision;
    const createRevision = revision;
    const createPromise = createOperation(notes);
    pendingHandle = createPromise;

    return createPromise
      .then((nextHandle) => {
        if (nextHandle === undefined) {
          if (!disposed && lifecycleRevision === createLifecycleRevision) {
            activeNotes.clear();
            emitActiveIntervals();
          }
          return;
        }

        if (disposed || lifecycleRevision !== createLifecycleRevision) {
          destroyOperation(nextHandle);
          return;
        }

        handle = nextHandle;

        if (revision !== createRevision) {
          updateOperation(nextHandle, getSortedNotes(activeNotes));
        }
      })
      .catch(() => {
        if (!disposed && lifecycleRevision === createLifecycleRevision) {
          activeNotes.clear();
          emitActiveIntervals();
        }
      })
      .finally(() => {
        if (pendingHandle === createPromise) {
          pendingHandle = undefined;
        }
      });
  };

  const startNote = (note: DroneNotePlaybackNote) => {
    const current = activeNotes.get(note.interval);

    if (notesMatch(current, note)) {
      return Promise.resolve();
    }

    activeNotes.set(note.interval, note);

    if (!current) {
      emitActiveIntervals();
    }

    return sync();
  };

  const stopNote = (interval: number) => {
    if (!activeNotes.delete(interval)) {
      return;
    }

    emitActiveIntervals();
    void sync();
  };

  return {
    activate: () => {
      disposed = false;
    },
    dispose: () => {
      disposed = true;
      lifecycleRevision += 1;
      revision += 1;
      pendingHandle = undefined;
      activeNotes.clear();

      if (handle !== undefined) {
        destroyOperation(handle);
        handle = undefined;
      }
    },
    getActiveIntervals: () => getSortedIntervals(activeNotes),
    reconcileNotes: (notes: readonly DroneNotePlaybackNote[]) => {
      const notesByInterval = new Map(
        notes.map((note) => [note.interval, note]),
      );
      let changed = false;

      activeNotes.forEach((activeNote, interval) => {
        const nextNote = notesByInterval.get(interval);

        if (!nextNote) {
          activeNotes.delete(interval);
          changed = true;
          return;
        }

        if (!notesMatch(activeNote, nextNote)) {
          activeNotes.set(interval, nextNote);
          changed = true;
        }
      });

      if (!changed) {
        return;
      }

      emitActiveIntervals();
      void sync();
    },
    reset: () => {
      lifecycleRevision += 1;
      revision += 1;
      handle = undefined;
      pendingHandle = undefined;

      if (activeNotes.size > 0) {
        activeNotes.clear();
        emitActiveIntervals();
      }
    },
    setOperations: (operations: {
      create: (
        notes: readonly DroneNotePlaybackNote[],
      ) => Promise<THandle | undefined>;
      destroy: (handle: THandle) => void;
      update: (
        handle: THandle,
        notes: readonly DroneNotePlaybackNote[],
      ) => boolean | void;
    }) => {
      createOperation = operations.create;
      destroyOperation = operations.destroy;
      updateOperation = operations.update;
    },
    startNote,
    stopAll: () => {
      if (activeNotes.size === 0) {
        return;
      }

      activeNotes.clear();
      emitActiveIntervals();
      void sync();
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

function createDroneRequest(
  notes: readonly DroneNotePlaybackNote[],
  fallbackPresetId: AudioPresetId,
): DroneRequest {
  return {
    notes: notes.map((note) => ({
      id: String(note.interval),
      midiNote: note.midi,
      velocity: note.velocity,
    })),
    presetId: notes[0]?.audioPresetId ?? fallbackPresetId,
    use: "drone",
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
      create: (nextNotes) =>
        musoAudioEngine.createDrone(
          createDroneRequest(nextNotes, resolvedAudioPresetId),
        ),
      destroy: (handle) => musoAudioEngine.destroyDrone(handle),
      onActiveIntervalsChange: setActiveIntervals,
      update: (handle, nextNotes) =>
        musoAudioEngine.updateDrone(
          handle,
          createDroneRequest(nextNotes, resolvedAudioPresetId),
        ),
    }),
  );

  useEffect(() => {
    controller.setOperations({
      create: (nextNotes) =>
        musoAudioEngine.createDrone(
          createDroneRequest(nextNotes, resolvedAudioPresetId),
        ),
      destroy: (handle) => musoAudioEngine.destroyDrone(handle),
      update: (handle, nextNotes) =>
        musoAudioEngine.updateDrone(
          handle,
          createDroneRequest(nextNotes, resolvedAudioPresetId),
        ),
    });
  }, [controller, resolvedAudioPresetId]);

  useEffect(() => {
    controller.reconcileNotes(playbackNotes);
  }, [controller, playbackNotes]);

  useEffect(
    () => musoAudioEngine.subscribeToReset(() => controller.reset()),
    [controller],
  );
  useEffect(
    () => musoAudioEngine.subscribeToStopAll(() => controller.reset()),
    [controller],
  );

  useEffect(() => {
    controller.activate();

    return () => {
      controller.dispose();
    };
  }, [controller]);

  return {
    activeIntervals,
    isNoteActive: (interval: number) => activeIntervals.includes(interval),
    stopAll: () => controller.stopAll(),
    toggleNote: (note: DroneNotePlaybackNote) =>
      controller.toggleNote(createPlaybackNote(note, resolvedAudioPresetId)),
  };
}
