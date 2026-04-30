import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { useEffect } from "react";

interface UseKeyboardNavigationParams {
  midiRange: readonly [number, number];
  onToggle: (key: string, midi: number) => void;
}

/**
 * Specialized hook for Keyboard navigation.
 */
export function useKeyboardNavigation<T extends HTMLElement>({
  midiRange,
  onToggle,
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
    onToggle,
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
