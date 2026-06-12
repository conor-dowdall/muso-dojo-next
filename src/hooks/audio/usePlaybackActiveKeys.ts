"use client";

import { useEffect, useState } from "react";
import { musoAudioEngine, type AudioVoiceHandle } from "@/audio";

const START_FALLBACK_SECONDS = 10;
const END_FALLBACK_GRACE_SECONDS = 1;

interface ActivePlaybackRun {
  timeout: ReturnType<typeof setTimeout>;
  token: number;
  unsubscribe?: () => void;
}

interface PlaybackActiveKeysControllerOptions<THandle> {
  onActiveKeysChange?: (activeKeys: ReadonlySet<string>) => void;
  subscribeToEnd: (handle: THandle, listener: () => void) => () => void;
}

export function createPlaybackActiveKeysController<THandle>({
  onActiveKeysChange,
  subscribeToEnd,
}: PlaybackActiveKeysControllerOptions<THandle>) {
  const activeKeys = new Set<string>();
  const runs = new Map<string, ActivePlaybackRun>();
  let nextToken = 0;

  const emit = () => onActiveKeysChange?.(new Set(activeKeys));

  const clearRunResources = (run: ActivePlaybackRun) => {
    clearTimeout(run.timeout);
    run.unsubscribe?.();
  };

  const finish = (key: string, token: number) => {
    const run = runs.get(key);

    if (run?.token !== token) {
      return;
    }

    clearRunResources(run);
    runs.delete(key);

    if (activeKeys.delete(key)) {
      emit();
    }
  };

  const begin = (key: string) => {
    const previousRun = runs.get(key);
    if (previousRun) {
      clearRunResources(previousRun);
    }

    const token = ++nextToken;
    const timeout = setTimeout(
      () => finish(key, token),
      START_FALLBACK_SECONDS * 1000,
    );
    runs.set(key, { timeout, token });

    if (!activeKeys.has(key)) {
      activeKeys.add(key);
      emit();
    }

    return token;
  };

  const attach = (
    key: string,
    token: number,
    handle: THandle,
    expectedDurationSeconds: number,
  ) => {
    const run = runs.get(key);

    if (run?.token !== token) {
      return;
    }

    clearTimeout(run.timeout);
    run.timeout = setTimeout(
      () => finish(key, token),
      (Math.max(0, expectedDurationSeconds) + END_FALLBACK_GRACE_SECONDS) *
        1000,
    );
    const unsubscribe = subscribeToEnd(handle, () => finish(key, token));

    if (runs.get(key)?.token === token) {
      run.unsubscribe = unsubscribe;
    } else {
      unsubscribe();
    }
  };

  return {
    attach,
    begin,
    cancel: finish,
    dispose: () => {
      runs.forEach(clearRunResources);
      runs.clear();
      activeKeys.clear();
    },
    getActiveKeys: () => new Set(activeKeys),
  };
}

export function usePlaybackActiveKeys() {
  const [activeKeys, setActiveKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [controller] = useState(() =>
    createPlaybackActiveKeysController<AudioVoiceHandle>({
      onActiveKeysChange: setActiveKeys,
      subscribeToEnd: (handle, listener) =>
        musoAudioEngine.subscribeToVoiceEnd(handle, listener),
    }),
  );

  useEffect(() => () => controller.dispose(), [controller]);

  return {
    activeKeys,
    attach: controller.attach,
    begin: controller.begin,
    cancel: controller.cancel,
  };
}
