"use client";

import { useCallback, useEffect, useState } from "react";

export type ManualPlaybackStatus = "idle" | "starting" | "playing";

interface ManualPlaybackControllerOptions<THandle> {
  onStatusChange?: (status: ManualPlaybackStatus) => void;
  start: () => Promise<THandle | undefined>;
  stop: (handle: THandle) => void;
}

interface UseManualPlaybackOptions<
  THandle,
> extends ManualPlaybackControllerOptions<THandle> {
  restartKey: string;
}

export function createManualPlaybackController<THandle>({
  onStatusChange,
  start,
  stop,
}: ManualPlaybackControllerOptions<THandle>) {
  let handle: THandle | undefined;
  let runToken = 0;
  let requestedActive = false;
  let status: ManualPlaybackStatus = "idle";
  let startOperation = start;
  let stopOperation = stop;

  const setStatus = (nextStatus: ManualPlaybackStatus) => {
    if (status === nextStatus) {
      return;
    }

    status = nextStatus;
    onStatusChange?.(nextStatus);
  };

  const startPlayback = async () => {
    if (requestedActive) {
      return;
    }

    requestedActive = true;
    const currentToken = ++runToken;
    setStatus("starting");

    try {
      const nextHandle = await startOperation();

      if (currentToken !== runToken || !requestedActive) {
        if (nextHandle !== undefined) {
          stopOperation(nextHandle);
        }
        return;
      }

      if (nextHandle === undefined) {
        requestedActive = false;
        setStatus("idle");
        return;
      }

      handle = nextHandle;
      setStatus("playing");
    } catch {
      if (currentToken === runToken) {
        requestedActive = false;
        setStatus("idle");
      }
    }
  };

  const stopPlayback = () => {
    requestedActive = false;
    runToken += 1;

    if (handle !== undefined) {
      const currentHandle = handle;
      handle = undefined;
      stopOperation(currentHandle);
    }

    setStatus("idle");
  };

  const restartPlayback = () => {
    if (!requestedActive) {
      return;
    }

    stopPlayback();
    void startPlayback();
  };

  return {
    dispose: () => {
      requestedActive = false;
      runToken += 1;

      if (handle !== undefined) {
        const currentHandle = handle;
        handle = undefined;
        stopOperation(currentHandle);
      }
    },
    getStatus: () => status,
    restart: restartPlayback,
    setOperations: (operations: {
      start: () => Promise<THandle | undefined>;
      stop: (handle: THandle) => void;
    }) => {
      startOperation = operations.start;
      stopOperation = operations.stop;
    },
    start: startPlayback,
    stop: stopPlayback,
    toggle: () => {
      if (requestedActive) {
        stopPlayback();
        return;
      }

      void startPlayback();
    },
  };
}

export function useManualPlayback<THandle>({
  restartKey,
  start,
  stop,
}: UseManualPlaybackOptions<THandle>) {
  const [status, setStatus] = useState<ManualPlaybackStatus>("idle");
  const [controller] = useState(() =>
    createManualPlaybackController<THandle>({
      onStatusChange: setStatus,
      start,
      stop,
    }),
  );

  const startPlayback = useCallback(() => {
    void controller.start();
  }, [controller]);

  const stopPlayback = useCallback(() => {
    controller.stop();
  }, [controller]);

  const togglePlayback = useCallback(() => {
    controller.toggle();
  }, [controller]);

  useEffect(() => {
    controller.setOperations({ start, stop });
  }, [controller, start, stop]);

  useEffect(() => {
    controller.restart();
  }, [controller, restartKey]);

  useEffect(
    () => () => {
      controller.dispose();
    },
    [controller],
  );

  return {
    isActive: status !== "idle",
    start: startPlayback,
    status,
    stop: stopPlayback,
    toggle: togglePlayback,
  };
}
