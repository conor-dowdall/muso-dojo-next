"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
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
  requiresSessionParts,
  type SessionViewMode,
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
import { useAppStore, useHydrateAppStore } from "@/stores/appStore";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";
import { createDefaultMusicPartConfig } from "@/utils/session/createSessionEntities";

interface HydratedSessionProps {
  onSessionViewModeChange: (mode: SessionViewMode) => void;
  sessionViewMode: SessionViewMode;
}

function HydratedSession({
  onSessionViewModeChange,
  sessionViewMode,
}: HydratedSessionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogKey, setAddDialogKey] = useState(0);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [sessionDialogKey, setSessionDialogKey] = useState(0);
  const [sessionDialogTempoId, setSessionDialogTempoId] = useState<
    string | null
  >(null);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
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
  const activeSessionPartCount = useAppStore((state) =>
    state.activeSessionId
      ? (state.sessions[state.activeSessionId]?.parts.length ?? 0)
      : 0,
  );
  const isPracticeViewMode = sessionViewMode !== "session";
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
  const exitPracticeViewMode = () => onSessionViewModeChange("session");

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stopAllAudioPlayback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isPracticeViewMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onSessionViewModeChange("session");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPracticeViewMode, onSessionViewModeChange]);

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
          variant={isPracticeViewMode ? "practice" : "full"}
          viewMode={sessionViewMode}
          onOpenAddDialog={openAddDialog}
          onOpenSessionsDialog={() => openSessionDialog()}
          onViewModeChange={handleSessionViewModeChange}
          onViewModeExit={isPracticeViewMode ? exitPracticeViewMode : undefined}
        />
      </div>
      {activeSessionId ? (
        <SessionView
          sessionId={activeSessionId}
          viewMode={sessionViewMode}
          onOpenAddDialog={isPracticeViewMode ? undefined : openAddDialog}
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

export default function DojoSessionPage() {
  const hasHydrated = useHydrateAppStore();
  const [sessionViewMode, setSessionViewMode] =
    useState<SessionViewMode>("session");
  const handleSessionViewModeChange = useCallback((mode: SessionViewMode) => {
    startTransition(() => setSessionViewMode(mode));
  }, []);
  const isPracticeViewMode = sessionViewMode !== "session";

  return (
    <main className={styles.main}>
      <div
        className={`${styles.container} ${hasHydrated ? styles.hydrated : ""}`}
        data-practice-view-mode={isPracticeViewMode ? true : undefined}
        data-session-view-mode={sessionViewMode}
      >
        {hasHydrated ? (
          <HydratedSession
            sessionViewMode={sessionViewMode}
            onSessionViewModeChange={handleSessionViewModeChange}
          />
        ) : (
          <SessionLoadingFallback />
        )}
      </div>
    </main>
  );
}
