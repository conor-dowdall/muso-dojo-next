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

interface UseDroneNotePlaybackOptions {
  audioPresetId?: AudioPresetId;
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
    isNoteActive: (note: DroneNotePlaybackNote) =>
      activeNoteIds.includes(getDroneNoteId(note)),
    stopAll: () => controller.stopAll(),
    toggleNote: (note: DroneNotePlaybackNote) => {
      if (!activeNoteIds.includes(getDroneNoteId(note))) {
        void ensureAudioReady();
      }

      controller.toggleNote(
        createDronePlaybackNote(note, resolvedAudioPresetId),
      );
    },
  };
}

export type { DroneNotePlaybackNote } from "./droneNotePlaybackController";
