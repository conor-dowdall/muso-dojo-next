"use client";

import { useEffect } from "react";
import {
  createPartSequencePlaybackPlan,
  ensureAudioReady,
  isAudioPlaybackActive,
  partSequenceCoordinator,
  stopAllAudioPlayback,
} from "@/audio";
import { type SessionViewMode } from "@/components/session/sessionViewMode";
import { type SessionConfig } from "@/types/session";

const editableShortcutTargetSelector = [
  "input",
  "select",
  "textarea",
  "[contenteditable]",
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="searchbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="textbox"]',
].join(",");

export type DojoGlobalShortcutAction =
  | "exit-view"
  | "stop-audio"
  | "toggle-practice-band";

interface DojoGlobalShortcutContext {
  audioPlaying: boolean;
  canTogglePracticeBand: boolean;
  dialogOpen: boolean;
  viewMode: SessionViewMode;
}

interface DojoGlobalShortcutEvent {
  altKey: boolean;
  code?: string;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  key?: string;
  metaKey: boolean;
  repeat?: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
}

interface UseDojoGlobalShortcutsOptions {
  activeSession?: SessionConfig;
  dialogOpen: boolean;
  onExitViewMode: () => void;
  viewMode: SessionViewMode;
}

function isEditableShortcutTarget(target: EventTarget | null) {
  return typeof Element !== "undefined" && target instanceof Element
    ? target.closest(editableShortcutTargetSelector) !== null
    : false;
}

function isEscapeKey(event: DojoGlobalShortcutEvent) {
  return event.key === "Escape";
}

function isSpaceKey(event: DojoGlobalShortcutEvent) {
  return event.key === " " || event.code === "Space";
}

function shouldIgnoreGlobalShortcut(event: DojoGlobalShortcutEvent) {
  return (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isEditableShortcutTarget(event.target)
  );
}

export function getDojoGlobalShortcutAction(
  event: DojoGlobalShortcutEvent,
  context: DojoGlobalShortcutContext,
): DojoGlobalShortcutAction | undefined {
  if (context.dialogOpen || shouldIgnoreGlobalShortcut(event)) {
    return undefined;
  }

  if (isEscapeKey(event)) {
    return context.audioPlaying
      ? "stop-audio"
      : context.viewMode === "session"
        ? undefined
        : "exit-view";
  }

  if (
    isSpaceKey(event) &&
    event.shiftKey &&
    !event.repeat &&
    context.canTogglePracticeBand
  ) {
    return "toggle-practice-band";
  }

  return undefined;
}

function togglePracticeBand(session: SessionConfig) {
  const snapshot = partSequenceCoordinator.getSnapshot();

  if (snapshot.playing) {
    partSequenceCoordinator.stop();
    return;
  }

  if (session.parts.length === 0) {
    return;
  }

  const plan = createPartSequencePlaybackPlan(session);

  void ensureAudioReady();
  void partSequenceCoordinator.start(plan);
}

export function useDojoGlobalShortcuts({
  activeSession,
  dialogOpen,
  onExitViewMode,
  viewMode,
}: UseDojoGlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getDojoGlobalShortcutAction(event, {
        audioPlaying: isAudioPlaybackActive(),
        canTogglePracticeBand: (activeSession?.parts.length ?? 0) > 0,
        dialogOpen,
        viewMode,
      });

      if (!action) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (action === "stop-audio") {
        stopAllAudioPlayback();
        return;
      }

      if (action === "exit-view") {
        onExitViewMode();
        return;
      }

      if (activeSession) {
        togglePracticeBand(activeSession);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [activeSession, dialogOpen, onExitViewMode, viewMode]);
}
