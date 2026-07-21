import { useInstrumentNavigation } from "@/hooks/instrument/useInstrumentNavigation";
import { type InstrumentNoteInteractionTarget } from "@/types/instrument";
import { useEffect } from "react";

interface UseFretboardNavigationParams {
  tuning: readonly number[];
  fretRange: readonly [number, number];
  leftHanded?: boolean;
  onInteract: (target: InstrumentNoteInteractionTarget) => void;
}

function parseFocusedKey(key: string): readonly [number, number] | undefined {
  const [rawStringIndex, rawFretNumber] = key.split("-");

  if (rawStringIndex === undefined || rawFretNumber === undefined) {
    return undefined;
  }

  const stringIndex = Number(rawStringIndex);
  const fretNumber = Number(rawFretNumber);

  return Number.isInteger(stringIndex) && Number.isInteger(fretNumber)
    ? [stringIndex, fretNumber]
    : undefined;
}

/**
 * Specialized hook for Fretboard navigation.
 */
export function useFretboardNavigation<T extends HTMLElement>({
  tuning,
  fretRange,
  leftHanded = false,
  onInteract,
}: UseFretboardNavigationParams) {
  const startFret = fretRange[0];
  const numFrets = fretRange[1] - fretRange[0] + 1;
  const initialFocusedKey = `0-${startFret}`;

  const getMidiForKey = (key: string) => {
    const [stringIndex, fret] = parseFocusedKey(key) ?? [0, startFret];
    return (tuning[stringIndex] ?? tuning[0] ?? 0) + fret;
  };

  const onNavigate = (
    currentKey: string,
    direction: "up" | "down" | "left" | "right",
  ) => {
    const [stringIndex, fretNumber] = parseFocusedKey(currentKey) ?? [
      0,
      startFret,
    ];
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
    onInteract,
    getMidiForKey,
    onNavigate,
  });
  const { focusedKey, setFocusedKey } = navigation;

  useEffect(() => {
    const maxStringIndex = tuning.length - 1;
    const maxFret = startFret + numFrets - 1;
    const focusedPosition = parseFocusedKey(focusedKey);
    const focusedStringIndex = focusedPosition?.[0];
    const focusedFret = focusedPosition?.[1];

    const isFocusedKeyValid =
      focusedStringIndex !== undefined &&
      focusedFret !== undefined &&
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
