import {
  type InstrumentNavigationDirection,
  useInstrumentNavigation,
} from "@/hooks/instrument/useInstrumentNavigation";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { useEffect } from "react";

interface UseKeyboardNavigationParams {
  midiRange: readonly [number, number];
  onInteract: (target: InstrumentNoteInteractionTarget) => void;
}

export function getNextKeyboardKey(
  currentKey: string,
  direction: InstrumentNavigationDirection,
  midiRange: readonly [number, number],
) {
  const [startMidi, endMidi] = midiRange;
  const parsedMidi = Number(currentKey);
  const midi = Number.isInteger(parsedMidi) ? parsedMidi : startMidi;

  if (direction === "left") return String(Math.max(startMidi, midi - 1));
  if (direction === "right") return String(Math.min(endMidi, midi + 1));
  return String(Math.min(endMidi, Math.max(startMidi, midi)));
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
    direction: InstrumentNavigationDirection,
  ) => getNextKeyboardKey(currentKey, direction, midiRange);

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
