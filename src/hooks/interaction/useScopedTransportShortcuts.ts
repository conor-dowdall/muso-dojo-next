"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEventHandler,
} from "react";

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

interface ScopedTransportShortcutOptions {
  isActive: boolean;
  onStop: () => void;
}

interface TransportKeyEvent {
  altKey: boolean;
  code?: string;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  key?: string;
  metaKey: boolean;
  preventDefault: () => void;
  shiftKey: boolean;
  stopPropagation: () => void;
  target: EventTarget | null;
}

interface ScopedTransportShortcutHandlers {
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDownCapture: PointerEventHandler<HTMLElement>;
}

let activeTransportShortcutScope: symbol | null = null;

function clearShortcutScope(scopeId: symbol) {
  if (activeTransportShortcutScope === scopeId) {
    activeTransportShortcutScope = null;
  }
}

function isSpaceKey(event: TransportKeyEvent) {
  return event.key === " " || event.code === "Space";
}

function isNodeTarget(target: EventTarget | null): target is Node {
  return typeof Node !== "undefined" && target instanceof Node;
}

function isEditableShortcutTarget(target: EventTarget | null) {
  return typeof Element !== "undefined" && target instanceof Element
    ? target.closest(editableShortcutTargetSelector) !== null
    : false;
}

function shouldIgnoreTransportShortcut(event: TransportKeyEvent) {
  return (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    isEditableShortcutTarget(event.target)
  );
}

export function shouldHandleScopedTransportShortcut(
  event: TransportKeyEvent,
  isActive: boolean,
) {
  return isActive && isSpaceKey(event) && !shouldIgnoreTransportShortcut(event);
}

export function useScopedTransportShortcuts({
  isActive,
  onStop,
}: ScopedTransportShortcutOptions): ScopedTransportShortcutHandlers {
  const scopeId = useRef(Symbol("transport-shortcut-scope"));
  const scopeRoot = useRef<HTMLElement | null>(null);
  const isActiveRef = useRef(isActive);
  const onStopRef = useRef(onStop);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  const claimShortcutScope = useCallback((root: HTMLElement) => {
    scopeRoot.current = root;
    activeTransportShortcutScope = scopeId.current;
  }, []);

  const releaseShortcutScope = useCallback(() => {
    clearShortcutScope(scopeId.current);
  }, []);

  const stopFromShortcut = useCallback(
    (event: TransportKeyEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onStopRef.current();
      releaseShortcutScope();
    },
    [releaseShortcutScope],
  );

  const onKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      claimShortcutScope(event.currentTarget);

      if (!shouldHandleScopedTransportShortcut(event, isActive)) {
        return;
      }

      stopFromShortcut(event);
    },
    [claimShortcutScope, isActive, stopFromShortcut],
  );

  const onPointerDownCapture = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!event.defaultPrevented) {
        claimShortcutScope(event.currentTarget);
      }
    },
    [claimShortcutScope],
  );

  useEffect(() => {
    const currentScopeId = scopeId.current;

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (activeTransportShortcutScope !== currentScopeId) {
        return;
      }

      if (!shouldHandleScopedTransportShortcut(event, isActiveRef.current)) {
        return;
      }

      stopFromShortcut(event);
    };

    const handleWindowPointerDown = () => {
      clearShortcutScope(currentScopeId);
    };

    const handleWindowFocusIn = (event: FocusEvent) => {
      if (activeTransportShortcutScope !== currentScopeId) {
        return;
      }

      const root = scopeRoot.current;

      if (root && isNodeTarget(event.target) && !root.contains(event.target)) {
        clearShortcutScope(currentScopeId);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("pointerdown", handleWindowPointerDown, true);
    window.addEventListener("focusin", handleWindowFocusIn);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("pointerdown", handleWindowPointerDown, true);
      window.removeEventListener("focusin", handleWindowFocusIn);
      clearShortcutScope(currentScopeId);
    };
  }, [stopFromShortcut]);

  return {
    onKeyDownCapture,
    onPointerDownCapture,
  };
}
