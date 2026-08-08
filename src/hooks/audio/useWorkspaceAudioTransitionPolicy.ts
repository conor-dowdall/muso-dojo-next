"use client";

import { useLayoutEffect } from "react";
import {
  stopAllAudioPlayback,
  WorkspaceAudioTransitionPolicy,
  type AudioWorkspaceScope,
} from "@/audio";
import { useAppStore } from "@/stores/appStore";
import { type AppStore } from "@/stores/app-store/types";

function selectAudioWorkspaceScope(state: AppStore): AudioWorkspaceScope {
  return {
    mountRevision: state.workspaceMountRevision,
    workspace: state.activeWorkspace,
  };
}

export function useWorkspaceAudioTransitionPolicy() {
  useLayoutEffect(() => {
    const policy = new WorkspaceAudioTransitionPolicy(
      selectAudioWorkspaceScope(useAppStore.getState()),
      stopAllAudioPlayback,
    );

    // Zustand store listeners run synchronously with the state transition.
    // This prevents the incoming workspace from observing outgoing playback.
    return useAppStore.subscribe((state) => {
      policy.reconcile(selectAudioWorkspaceScope(state));
    });
  }, []);
}
