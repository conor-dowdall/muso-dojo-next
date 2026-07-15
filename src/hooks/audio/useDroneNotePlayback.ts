"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureAudioReady,
  getDefaultAudioPresetId,
  musoAudioEngine,
  type AudioPresetId,
  type DroneHandle,
  type DroneRequest,
} from "@/audio";
import {
  createDroneNotePlaybackController,
  createDronePlaybackNote,
  getDroneNoteId,
  type DroneNotePlaybackNote,
} from "./droneNotePlaybackController";
import { dronePlaybackCoordinator } from "./dronePlaybackCoordinator";

interface UseDroneNotePlaybackOptions {
  audioPresetId?: AudioPresetId;
  id: string;
  notes: readonly DroneNotePlaybackNote[];
}

function createDroneRequest(
  notes: readonly DroneNotePlaybackNote[],
  fallbackPresetId: AudioPresetId,
): DroneRequest {
  return {
    notes: notes.map((note) => ({
      id: getDroneNoteId(note),
      midiNote: note.midi,
      velocity: note.velocity,
    })),
    presetId: notes[0]?.audioPresetId ?? fallbackPresetId,
    use: "drone",
  };
}

export function useDroneNotePlayback({
  audioPresetId,
  id,
  notes,
}: UseDroneNotePlaybackOptions) {
  const resolvedAudioPresetId =
    audioPresetId ?? getDefaultAudioPresetId("drone");
  const playbackNotes = useMemo(
    () =>
      notes.map((note) => createDronePlaybackNote(note, resolvedAudioPresetId)),
    [notes, resolvedAudioPresetId],
  );
  const [activeIntervals, setActiveIntervals] = useState<number[]>([]);
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);
  const [controller] = useState(() =>
    createDroneNotePlaybackController<DroneHandle>({
      create: (nextNotes) =>
        musoAudioEngine.createDrone(
          createDroneRequest(nextNotes, resolvedAudioPresetId),
        ),
      destroy: (handle) => musoAudioEngine.destroyDrone(handle),
      onActiveNoteIdsChange: setActiveNoteIds,
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
    () =>
      dronePlaybackCoordinator.register(id, {
        stopAll: () => controller.stopAll(),
      }),
    [controller, id],
  );

  useEffect(() => {
    if (activeNoteIds.length === 0) {
      dronePlaybackCoordinator.clear(id);
    }
  }, [activeNoteIds.length, id]);

  useEffect(
    () =>
      musoAudioEngine.subscribeToStopAll(() => {
        controller.reset();
        dronePlaybackCoordinator.clear(id);
      }),
    [controller, id],
  );

  useEffect(() => {
    controller.activate();

    return () => {
      controller.dispose();
    };
  }, [controller]);

  return {
    activeIntervals,
    isNoteActive: (note: DroneNotePlaybackNote) =>
      activeNoteIds.includes(getDroneNoteId(note)),
    stopAll: () => {
      controller.stopAll();
      dronePlaybackCoordinator.clear(id);
    },
    toggleNote: (note: DroneNotePlaybackNote) => {
      const noteId = getDroneNoteId(note);
      const startsNote = !activeNoteIds.includes(noteId);

      if (startsNote) {
        // A Drone is a persistent accompaniment layer, not a competing
        // transport. It may continue underneath band and module playback.
        void ensureAudioReady();
        dronePlaybackCoordinator.activate(id);
      }

      controller.toggleNote(
        createDronePlaybackNote(note, resolvedAudioPresetId),
      );

      if (activeNoteIds.length === 1 && !startsNote) {
        dronePlaybackCoordinator.clear(id);
      }
    },
  };
}

export type { DroneNotePlaybackNote } from "./droneNotePlaybackController";
