import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { useEffect } from "react";

interface UseKeyboardNavigationParams {
  midiRange: readonly [number, number];
  onInteract: (target: InstrumentNoteInteractionTarget) => void;
}

/**
 * Specialized hook for Keyboard navigation.
 */
export function useKeyboardNavigation<T extends HTMLElement>({
  midiRange,
  onInteract,
}: UseKeyboardNavigationParams) {
  const [startMidi, endMidi] = midiRange;
  const initialFocusedKey = String(startMidi);

  const getMidiForKey = (key: string) => Number(key);

  const onNavigate = (
    currentKey: string,
    direction: "up" | "down" | "left" | "right",
  ) => {
    const midi = Number(currentKey);
    if (direction === "left") return String(Math.max(startMidi, midi - 1));
    if (direction === "right") return String(Math.min(endMidi, midi + 1));
    return currentKey;
  };

  const navigation = useInstrumentNavigation<T>({
    initialFocusedKey,
    onInteract,
    getMidiForKey,
    onNavigate,
  });
  const { focusedKey, setFocusedKey } = navigation;

  useEffect(() => {
    const focusedMidi = Number(focusedKey);
    const isFocusedKeyValid =
      Number.isInteger(focusedMidi) &&
      focusedMidi >= startMidi &&
      focusedMidi <= endMidi;

    if (!isFocusedKeyValid) {
      setFocusedKey(initialFocusedKey);
    }
  }, [endMidi, focusedKey, initialFocusedKey, setFocusedKey, startMidi]);

  return navigation;
}
