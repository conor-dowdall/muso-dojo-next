import { useState, useRef, type KeyboardEvent } from "react";

interface UseInstrumentNavigationParams {
  initialFocusedKey: string;
  onToggle: (key: string, midi: number) => void;
  getMidiForKey: (key: string) => number;
  onNavigate?: (
    currentKey: string,
    direction: "up" | "down" | "left" | "right",
  ) => string | undefined;
}

/**
 * Handles instrument keyboard navigation and focus management with roving tabindex.
 * Optimized via React Compiler, manual memoization omitted.
 */
export function useInstrumentNavigation<T extends HTMLElement>({
  initialFocusedKey,
  onToggle,
  getMidiForKey,
  onNavigate,
}: UseInstrumentNavigationParams) {
  const [focusedKey, setFocusedKey] = useState<string>(initialFocusedKey);
  const itemRefs = useRef<Map<string, T>>(new Map());

  const setItemRef = (key: string, el: T | null) => {
    if (el) {
      itemRefs.current.set(key, el);
    } else {
      itemRefs.current.delete(key);
    }
  };

  const focusItem = (key: string) => {
    setFocusedKey(key);
    const element = itemRefs.current.get(key);
    if (element) {
      element.focus();
    }
  };

  const interactItem = (key: string) => {
    focusItem(key);
    onToggle(key, getMidiForKey(key));
  };

  const handleKeyDown = (e: KeyboardEvent, key: string) => {
    const midi = getMidiForKey(key);

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(key, midi);
      return;
    }

    const directionMap: Record<string, "up" | "down" | "left" | "right"> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const direction = directionMap[e.key];
    if (direction && onNavigate) {
      const nextKey = onNavigate(key, direction);
      if (nextKey && nextKey !== key) {
        e.preventDefault();
        focusItem(nextKey);
      }
    }
  };

  return {
    focusedKey,
    setFocusedKey,
    setItemRef,
    focusItem,
    interactItem,
    handleKeyDown,
  };
}
