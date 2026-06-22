"use client";

import { useCallback, type KeyboardEvent } from "react";

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

function isSpaceKey(event: KeyboardEvent) {
  return event.key === " " || event.code === "Space";
}

function isEditableShortcutTarget(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest(editableShortcutTargetSelector) !== null
    : false;
}

function shouldIgnoreTransportShortcut(event: KeyboardEvent) {
  return (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isEditableShortcutTarget(event.target)
  );
}

export function useScopedTransportShortcuts({
  isActive,
  onStop,
}: ScopedTransportShortcutOptions) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (
        !isActive ||
        !isSpaceKey(event) ||
        shouldIgnoreTransportShortcut(event)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onStop();
    },
    [isActive, onStop],
  );
}
