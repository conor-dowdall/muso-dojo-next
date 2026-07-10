"use client";

import { useSyncExternalStore } from "react";
import { musoAudioEngine } from "@/audio";

const getSnapshot = () => musoAudioEngine.hasActivePlayback();

export function useAudioPlaybackActive() {
  return useSyncExternalStore(
    musoAudioEngine.subscribeToPlaybackActivity,
    getSnapshot,
    () => false,
  );
}
