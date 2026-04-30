import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { useEffect } from "react";

interface UseFretboardNavigationParams {
  tuning: readonly number[];
  fretRange: readonly [number, number];
  leftHanded?: boolean;
  onToggle: (key: string, midi: number) => void;
}

/**
 * Specialized hook for Fretboard navigation.
 */
export function useFretboardNavigation<T extends HTMLElement>({
  tuning,
  fretRange,
  leftHanded = false,
  onToggle,
}: UseFretboardNavigationParams) {
  const startFret = fretRange[0];
  const numFrets = fretRange[1] - fretRange[0] + 1;
  const initialFocusedKey = `0-${startFret}`;

  const getMidiForKey = (key: string) => {
    const [stringIndex, fret] = key.split("-").map(Number);
    return tuning[stringIndex] + fret;
  };

  const onNavigate = (
    currentKey: string,
    direction: "up" | "down" | "left" | "right",
  ) => {
    const [stringIndex, fretNumber] = currentKey.split("-").map(Number);
    let nextString = stringIndex;
    let nextFret = fretNumber;

    if (direction === "up") {
      nextString = Math.max(0, stringIndex - 1);
    } else if (direction === "down") {
      nextString = Math.min(tuning.length - 1, stringIndex + 1);
    } else if (direction === "left" || direction === "right") {
      const moveDirection =
        (direction === "left" ? -1 : 1) * (leftHanded ? -1 : 1);
      nextFret = Math.min(
        startFret + numFrets - 1,
        Math.max(startFret, fretNumber + moveDirection),
      );
    }

    return `${nextString}-${nextFret}`;
  };

  const navigation = useInstrumentNavigation<T>({
    initialFocusedKey,
    onToggle,
    getMidiForKey,
    onNavigate,
  });
  const { focusedKey, setFocusedKey } = navigation;

  useEffect(() => {
    const maxStringIndex = tuning.length - 1;
    const maxFret = startFret + numFrets - 1;
    const [focusedStringIndex, focusedFret] = focusedKey.split("-").map(Number);

    const isFocusedKeyValid =
      Number.isInteger(focusedStringIndex) &&
      Number.isInteger(focusedFret) &&
      focusedStringIndex >= 0 &&
      focusedStringIndex <= maxStringIndex &&
      focusedFret >= startFret &&
      focusedFret <= maxFret;

    if (!isFocusedKeyValid) {
      setFocusedKey(initialFocusedKey);
    }
  }, [
    focusedKey,
    initialFocusedKey,
    numFrets,
    setFocusedKey,
    startFret,
    tuning.length,
  ]);

  return navigation;
}
