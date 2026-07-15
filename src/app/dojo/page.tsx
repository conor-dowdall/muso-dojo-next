"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useShallow } from "zustand/react/shallow";
import styles from "./page.module.css";
import { AudioStatusViewport } from "@/components/audio/AudioStatusViewport";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { AddToSessionDialog } from "@/components/session/AddToSessionDialog";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionLoader } from "@/components/session/SessionLoader";
import { SessionManagementDialog } from "@/components/session/SessionManagementDialog";
import { SessionView } from "@/components/session/SessionView";
import {
  isSessionFocusViewMode,
  isSessionWorkspaceViewMode,
  requiresSessionParts,
  type SessionViewMode,
  type SessionWorkspaceViewMode,
} from "@/components/session/sessionViewMode";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import {
  ensureAudioReady,
  musoAudioEngine,
  partSequenceCoordinator,
  stopAllAudioPlayback,
} from "@/audio";
import { useDojoGlobalShortcuts } from "@/hooks/interaction/useDojoGlobalShortcuts";
import { useSessionPlaybackReconciliation } from "@/hooks/audio/useSessionPlaybackReconciliation";
import { useAppStore, useHydrateAppStore } from "@/stores/appStore";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";
import { createDefaultMusicPartConfig } from "@/utils/session/createSessionEntities";

interface HydratedSessionProps {
  onSessionViewModeChange: (mode: SessionViewMode) => void;
  sessionViewMode: SessionViewMode;
  sessionWorkspaceViewMode: SessionWorkspaceViewMode;
  viewModeTransitionPending: boolean;
}

function HydratedSession({
  onSessionViewModeChange,
  sessionViewMode,
  sessionWorkspaceViewMode,
  viewModeTransitionPending,
}: HydratedSessionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogKey, setAddDialogKey] = useState(0);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionDialogKey, setSessionDialogKey] = useState(0);
  const [sessionDialogTempoId, setSessionDialogTempoId] = useState<
    string | null
  >(null);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const activeSession = useAppStore((state) =>
    state.activeSessionId ? state.sessions[state.activeSessionId] : undefined,
  );
  const instrumentCreationRangeContextSignature = useAppStore(
    useShallow((state) =>
      createInstrumentCreationRangeContextSignature(
        state.activeSessionId
          ? (state.sessions[state.activeSessionId]?.parts ?? [])
          : [],
      ),
    ),
  );
  const addPart = useAppStore((state) => state.addPart);
  const addParts = useAppStore((state) => state.addParts);
  const replaceParts = useAppStore((state) => state.replaceParts);
  const activeSessionPartCount = activeSession?.parts.length ?? 0;
  const isFocusViewMode = isSessionFocusViewMode(sessionViewMode);
  const closeAddDialog = () => setIsAddDialogOpen(false);
  const instrumentCreationRangeContext =
    createInstrumentCreationRangeContextFromSignature(
      instrumentCreationRangeContextSignature,
    );
  const openAddDialog = () => {
    setIsSessionDialogOpen(false);
    setAddDialogKey((currentKey) => currentKey + 1);
    setIsAddDialogOpen(true);
  };
  const openSessionDialog = (tempoSessionId?: string) => {
    setIsAddDialogOpen(false);
    setSessionDialogKey((currentKey) => currentKey + 1);
    setSessionDialogTempoId(tempoSessionId ?? null);
    setIsSessionDialogOpen(true);
  };
  const handleSessionViewModeChange = (nextViewMode: SessionViewMode) => {
    if (nextViewMode !== "session") {
      setIsAddDialogOpen(false);
      void ensureAudioReady({ feedback: "silent" });
    }

    onSessionViewModeChange(nextViewMode);
  };
  const exitFocusViewMode = useCallback(() => {
    onSessionViewModeChange(sessionWorkspaceViewMode);
  }, [onSessionViewModeChange, sessionWorkspaceViewMode]);

  useDojoGlobalShortcuts({
    activeSession,
    dialogOpen: isAddDialogOpen || isSessionDialogOpen,
    onExitFocusMode: isFocusViewMode ? exitFocusViewMode : undefined,
  });
  useSessionPlaybackReconciliation(activeSession);

  useEffect(() => {
    if (!activeSessionId || !musoAudioEngine.isSupported()) {
      return;
    }

    const gestureEvents = ["pointerdown", "keydown"] as const;
    const listenerOptions = {
      capture: true,
      passive: true,
    } satisfies AddEventListenerOptions;

    function removeListeners() {
      gestureEvents.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          handleFirstUserGesture,
          listenerOptions,
        );
      });
    }

    function handleFirstUserGesture() {
      removeListeners();
      void ensureAudioReady({ feedback: "silent" });
    }

    gestureEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        handleFirstUserGesture,
        listenerOptions,
      );
    });

    return removeListeners;
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId || !musoAudioEngine.isSupported()) {
      return;
    }

    void musoAudioEngine.warm();
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId && sessionViewMode !== "session") {
      onSessionViewModeChange("session");
    }
  }, [activeSessionId, onSessionViewModeChange, sessionViewMode]);

  useEffect(() => {
    if (activeSessionPartCount === 0 && requiresSessionParts(sessionViewMode)) {
      onSessionViewModeChange("session");
    }
  }, [activeSessionPartCount, onSessionViewModeChange, sessionViewMode]);

  useEffect(() => {
    const snapshot = partSequenceCoordinator.getSnapshot();

    if (
      snapshot.playing &&
      (activeSessionId === null || snapshot.sessionId !== activeSessionId)
    ) {
      partSequenceCoordinator.stop();
    }
  }, [activeSessionId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopAllAudioPlayback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <>
      <div className={styles.sessionChrome}>
        <SessionHeader
          viewMode={sessionViewMode}
          workspaceViewMode={sessionWorkspaceViewMode}
          onOpenAddDialog={openAddDialog}
          onOpenSessionTempo={openSessionDialog}
          onOpenSessionsDialog={() => openSessionDialog()}
          onViewModeChange={handleSessionViewModeChange}
          onViewModeExit={isFocusViewMode ? exitFocusViewMode : undefined}
          viewModeTransitionPending={viewModeTransitionPending}
        />
      </div>
      {activeSessionId ? (
        <SessionView
          sessionId={activeSessionId}
          viewMode={sessionViewMode}
          onOpenAddDialog={isFocusViewMode ? undefined : openAddDialog}
          onOpenSessionTempo={openSessionDialog}
        />
      ) : null}
      <Dialog
        isOpen={isSessionDialogOpen}
        onClose={() => setIsSessionDialogOpen(false)}
        size="standard"
      >
        <SessionManagementDialog
          key={sessionDialogKey}
          initialOpenTempoSessionId={sessionDialogTempoId ?? undefined}
          onClose={() => setIsSessionDialogOpen(false)}
        />
      </Dialog>
      <Dialog isOpen={isAddDialogOpen} onClose={closeAddDialog} size="wide">
        <AddToSessionDialog
          key={addDialogKey}
          canReplaceSession={activeSessionPartCount > 0}
          instrumentCreationRangeContext={instrumentCreationRangeContext}
          onAddCustomChordOrScale={({
            rootNote,
            noteCollectionKey,
            moduleRequests,
            replaceSession,
          }) => {
            if (!activeSessionId) {
              return;
            }

            const partSettings = {
              rootNote,
              noteCollectionKey,
              moduleRequests,
            };

            if (replaceSession) {
              replaceParts(activeSessionId, [
                createDefaultMusicPartConfig(partSettings),
              ]);
              return;
            }

            addPart(activeSessionId, partSettings);
          }}
          onAddChordProgression={(settings) => {
            if (!activeSessionId) {
              return;
            }

            const parts = createChordProgressionParts(settings);

            if (settings.replaceSession) {
              replaceParts(activeSessionId, parts);
              return;
            }

            addParts(activeSessionId, parts);
          }}
          onClose={closeAddDialog}
        />
      </Dialog>
      <AudioStatusViewport />
    </>
  );
}

function SessionLoadingFallback() {
  return <SessionLoader />;
}

function HydratedDojoSessionPage() {
  const sessionWorkspaceViewMode = useAppStore(
    (state) => state.sessionWorkspaceViewMode,
  );
  const persistSessionWorkspaceViewMode = useAppStore(
    (state) => state.setSessionWorkspaceViewMode,
  );
  const [sessionViewMode, setSessionViewMode] = useState<SessionViewMode>(
    () => sessionWorkspaceViewMode,
  );
  const [viewModeTransitionPending, startViewModeTransition] = useTransition();
  const handleSessionViewModeChange = useCallback(
    (mode: SessionViewMode) => {
      const resolvedMode = isSessionWorkspaceViewMode(mode)
        ? persistSessionWorkspaceViewMode(mode)
        : mode;

      // Session views can contain several complex instruments. Let React split
      // that work across tasks so the main-thread audio lookahead can keep
      // scheduling while the view changes. Only Session and Chart are persisted;
      // Live and Clean return to that underlying workspace when closed.
      startViewModeTransition(() => setSessionViewMode(resolvedMode));
    },
    [persistSessionWorkspaceViewMode],
  );
  const isFocusViewMode = isSessionFocusViewMode(sessionViewMode);

  return (
    <main className={styles.main}>
      <div
        className={`${styles.container} ${styles.hydrated}`}
        data-session-focus-mode={isFocusViewMode ? true : undefined}
        data-session-view-mode={sessionViewMode}
      >
        <HydratedSession
          sessionViewMode={sessionViewMode}
          sessionWorkspaceViewMode={sessionWorkspaceViewMode}
          onSessionViewModeChange={handleSessionViewModeChange}
          viewModeTransitionPending={viewModeTransitionPending}
        />
      </div>
    </main>
  );
}

export default function DojoSessionPage() {
  const hasHydrated = useHydrateAppStore();

  if (hasHydrated) {
    return <HydratedDojoSessionPage />;
  }

  return (
    <main className={styles.main}>
      <div className={styles.container} data-session-view-mode="session">
        <SessionLoadingFallback />
      </div>
    </main>
  );
}
