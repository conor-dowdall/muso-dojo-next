"use client";

import { useSyncExternalStore } from "react";
import { audioReadiness } from "@/audio";

export function useAudioReadinessSnapshot() {
  return useSyncExternalStore(
    audioReadiness.subscribe,
    audioReadiness.getSnapshot,
    audioReadiness.getSnapshot,
  );
}
