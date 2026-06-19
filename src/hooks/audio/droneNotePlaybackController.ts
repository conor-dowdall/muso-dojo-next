import { type AudioPresetId } from "@/audio";
import { resolveCollectionPositionMatch } from "@/utils/music-theory/collectionPositionIdentity";

const DRONE_BASE_VELOCITY = 0.65;
const DRONE_BALANCE_REFERENCE_INTERVAL = 24;
const DRONE_ABOVE_ROOT_INITIAL_SCALE = 0.5;
const DRONE_ABOVE_ROOT_MIN_SCALE = 0.1;

export interface DroneNotePlaybackNote {
  audioPresetId?: AudioPresetId;
  collectionPosition: number;
  collectionSize: number;
  interval: number;
  intervalDegree?: number;
  midi: number;
  velocity?: number;
}

interface DroneNotePlaybackControllerOptions<THandle> {
  create: (
    notes: readonly DroneNotePlaybackNote[],
  ) => Promise<THandle | undefined>;
  destroy: (handle: THandle) => void;
  onActiveNoteIdsChange?: (activeNoteIds: string[]) => void;
  onActiveIntervalsChange?: (activeIntervals: number[]) => void;
  update: (
    handle: THandle,
    notes: readonly DroneNotePlaybackNote[],
  ) => boolean | void;
}

export function getDroneNoteId(note: DroneNotePlaybackNote) {
  return String(note.collectionPosition);
}

function getSortedNotes(activeNotes: Map<string, DroneNotePlaybackNote>) {
  return [...activeNotes.values()].sort(
    (left, right) => left.interval - right.interval,
  );
}

function getSortedIntervals(activeNotes: Map<string, DroneNotePlaybackNote>) {
  return getSortedNotes(activeNotes).map((note) => note.interval);
}

function notesMatch(
  current: DroneNotePlaybackNote | undefined,
  next: DroneNotePlaybackNote,
) {
  return (
    current?.audioPresetId === next.audioPresetId &&
    current?.collectionSize === next.collectionSize &&
    current?.interval === next.interval &&
    current?.intervalDegree === next.intervalDegree &&
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

export function createDronePlaybackNote(
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
  onActiveNoteIdsChange,
  onActiveIntervalsChange,
  update,
}: DroneNotePlaybackControllerOptions<THandle>) {
  const activeNotes = new Map<string, DroneNotePlaybackNote>();
  let createOperation = create;
  let destroyOperation = destroy;
  let updateOperation = update;
  let handle: THandle | undefined;
  let pendingHandle: Promise<THandle | undefined> | undefined;
  let disposed = false;
  let lifecycleRevision = 0;
  let revision = 0;

  const emitActiveNotes = () => {
    onActiveIntervalsChange?.(getSortedIntervals(activeNotes));
    onActiveNoteIdsChange?.(
      getSortedNotes(activeNotes).map((note) => getDroneNoteId(note)),
    );
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
            emitActiveNotes();
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
          emitActiveNotes();
        }
      })
      .finally(() => {
        if (pendingHandle === createPromise) {
          pendingHandle = undefined;
        }
      });
  };

  const startNote = (note: DroneNotePlaybackNote) => {
    const noteId = getDroneNoteId(note);
    const current = activeNotes.get(noteId);

    if (notesMatch(current, note)) {
      return Promise.resolve();
    }

    activeNotes.set(noteId, note);

    if (!current) {
      emitActiveNotes();
    }

    return sync();
  };

  const stopNote = (interval: number) => {
    const noteId = [...activeNotes].find(
      ([, note]) => note.interval === interval,
    )?.[0];

    if (noteId === undefined || !activeNotes.delete(noteId)) {
      return;
    }

    emitActiveNotes();
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
      const nextActiveNotes = new Map<string, DroneNotePlaybackNote>();
      let changed = false;

      activeNotes.forEach((activeNote, noteId) => {
        const nextNote = resolveCollectionPositionMatch({
          candidates: notes,
          identity: activeNote,
        });

        if (!nextNote) {
          changed = true;
          return;
        }

        const nextNoteId = getDroneNoteId(nextNote);
        nextActiveNotes.set(nextNoteId, nextNote);

        if (noteId !== nextNoteId || !notesMatch(activeNote, nextNote)) {
          changed = true;
        }
      });

      if (!changed) {
        return;
      }

      activeNotes.clear();
      nextActiveNotes.forEach((note, noteId) => activeNotes.set(noteId, note));
      emitActiveNotes();
      void sync();
    },
    reset: () => {
      lifecycleRevision += 1;
      revision += 1;
      handle = undefined;
      pendingHandle = undefined;

      if (activeNotes.size > 0) {
        activeNotes.clear();
        emitActiveNotes();
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
      emitActiveNotes();
      void sync();
    },
    stopNote,
    toggleNote: (note: DroneNotePlaybackNote) => {
      const noteId = getDroneNoteId(note);

      if (activeNotes.has(noteId)) {
        activeNotes.delete(noteId);
        emitActiveNotes();
        void sync();
        return;
      }

      void startNote(note);
    },
  };
}
