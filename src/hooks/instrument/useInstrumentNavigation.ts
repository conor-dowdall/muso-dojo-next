import {
  useCallback,
  useLayoutEffect,
  useState,
  useRef,
  type KeyboardEvent,
} from "react";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { createInstrumentNoteInteractionTarget } from "@/utils/instrument/createInstrumentNoteInteractionTarget";

interface UseInstrumentNavigationParams {
  initialFocusedKey: string;
  onInteract: (target: InstrumentNoteInteractionTarget) => void;
  getMidiForKey: (key: string) => number;
  onNavigate?: (
    currentKey: string,
    direction: "up" | "down" | "left" | "right",
  ) => string | undefined;
}

/**
 * Handles instrument keyboard navigation and focus management with roving tabindex.
 */
export function useInstrumentNavigation<T extends HTMLElement>({
  initialFocusedKey,
  onInteract,
  getMidiForKey,
  onNavigate,
}: UseInstrumentNavigationParams) {
  const [focusedKey, setFocusedKey] = useState<string>(initialFocusedKey);
  const itemRefs = useRef<Map<string, T>>(new Map());
  const onInteractRef = useRef(onInteract);
  const getMidiForKeyRef = useRef(getMidiForKey);
  const onNavigateRef = useRef(onNavigate);

  useLayoutEffect(() => {
    onInteractRef.current = onInteract;
    getMidiForKeyRef.current = getMidiForKey;
    onNavigateRef.current = onNavigate;
  }, [getMidiForKey, onInteract, onNavigate]);

  const setItemRef = useCallback((key: string, el: T | null) => {
    if (el) {
      itemRefs.current.set(key, el);
    } else {
      itemRefs.current.delete(key);
    }
  }, []);

  const focusItem = useCallback((key: string) => {
    setFocusedKey(key);
    const element = itemRefs.current.get(key);
    if (element) {
      element.focus();
    }
  }, []);

  const handleItemInteraction = useCallback(
    (target: InstrumentNoteInteractionTarget) => {
      onInteractRef.current(target);
      focusItem(target.key);
    },
    [focusItem],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, key: string) => {
      const midi = getMidiForKeyRef.current(key);

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onInteractRef.current(createInstrumentNoteInteractionTarget(key, midi));
        return;
      }

      const directionMap: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      const direction = directionMap[e.key];
      if (direction && onNavigateRef.current) {
        const nextKey = onNavigateRef.current(key, direction);
        if (nextKey && nextKey !== key) {
          e.preventDefault();
          focusItem(nextKey);
        }
      }
    },
    [focusItem],
  );

  return {
    focusedKey,
    setFocusedKey,
    setItemRef,
    focusItem,
    handleItemInteraction,
    handleKeyDown,
  };
}
