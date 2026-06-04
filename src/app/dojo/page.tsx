"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import styles from "./page.module.css";
import { IconButton } from "@/components/ui/buttons/IconButton";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { AddToSessionDialog } from "@/components/session/AddToSessionDialog";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionLoader } from "@/components/session/SessionLoader";
import { SessionView } from "@/components/session/SessionView";
import {
  createInstrumentCreationRangeContextFromSignature,
  createInstrumentCreationRangeContextSignature,
} from "@/components/instrument-creation/instrumentCreationRangeContext";
import { musoAudioEngine, resolveMasterAmbiencePresetId } from "@/audio";
import { useAppStore, useHydrateAppStore } from "@/stores/appStore";
import { createChordProgressionParts } from "@/utils/music-part/createChordProgressionParts";
import { createDefaultMusicPartConfig } from "@/utils/session/createSessionEntities";

interface HydratedSessionProps {
  isPerformanceMode: boolean;
  onPerformanceModeChange: (isPerformanceMode: boolean) => void;
}

function HydratedSession({
  isPerformanceMode,
  onPerformanceModeChange,
}: HydratedSessionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addDialogKey, setAddDialogKey] = useState(0);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const masterAmbiencePresetId = useAppStore((state) =>
    resolveMasterAmbiencePresetId(state.dojoSettings.masterAmbiencePresetId),
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
  const activeSessionPartCount = useAppStore((state) =>
    state.activeSessionId
      ? (state.sessions[state.activeSessionId]?.parts.length ?? 0)
      : 0,
  );
  const closeAddDialog = () => setIsAddDialogOpen(false);
  const instrumentCreationRangeContext =
    createInstrumentCreationRangeContextFromSignature(
      instrumentCreationRangeContextSignature,
    );
  const openAddDialog = () => {
    setAddDialogKey((currentKey) => currentKey + 1);
    setIsAddDialogOpen(true);
  };
  const enterPerformanceMode = () => {
    setIsAddDialogOpen(false);
    void musoAudioEngine.prime().catch(() => undefined);
    onPerformanceModeChange(true);
  };
  const exitPerformanceMode = () => onPerformanceModeChange(false);

  useEffect(() => {
    musoAudioEngine.setMasterAmbiencePresetId(masterAmbiencePresetId);
  }, [masterAmbiencePresetId]);

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
      void musoAudioEngine.prime().catch(() => undefined);
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
    if (!activeSessionId && isPerformanceMode) {
      onPerformanceModeChange(false);
    }
  }, [activeSessionId, isPerformanceMode, onPerformanceModeChange]);

  useEffect(() => {
    if (!isPerformanceMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onPerformanceModeChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPerformanceMode, onPerformanceModeChange]);

  return (
    <>
      {isPerformanceMode ? (
        <IconButton
          aria-label="Exit performance mode"
          className={styles.performanceModeExit}
          icon={<X />}
          size="sm"
          tooltip={false}
          variant="ghost"
          shouldYield={false}
          onClick={exitPerformanceMode}
        />
      ) : (
        <SessionHeader
          onEnterPerformanceMode={enterPerformanceMode}
          onOpenAddDialog={openAddDialog}
        />
      )}
      {activeSessionId ? (
        <SessionView
          isPerformanceMode={isPerformanceMode}
          sessionId={activeSessionId}
          onOpenAddDialog={isPerformanceMode ? undefined : openAddDialog}
        />
      ) : null}
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
    </>
  );
}

function SessionLoadingFallback() {
  return <SessionLoader />;
}

export default function DojoSessionPage() {
  const hasHydrated = useHydrateAppStore();
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  return (
    <main className={styles.main}>
      <div
        className={`${styles.container} ${hasHydrated ? styles.hydrated : ""}`}
        data-performance-mode={isPerformanceMode ? true : undefined}
      >
        {hasHydrated ? (
          <HydratedSession
            isPerformanceMode={isPerformanceMode}
            onPerformanceModeChange={setIsPerformanceMode}
          />
        ) : (
          <SessionLoadingFallback />
        )}
      </div>
    </main>
  );
}
