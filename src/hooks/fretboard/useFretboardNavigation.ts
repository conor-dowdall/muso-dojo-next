import {
  type InstrumentNavigationDirection,
  useInstrumentNavigation,
} from "@/hooks/instrument/useInstrumentNavigation";
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

export function getNextFretboardKey({
  currentKey,
  direction,
  fretRange,
  leftHanded = false,
  stringCount,
}: {
  currentKey: string;
  direction: InstrumentNavigationDirection;
  fretRange: readonly [number, number];
  leftHanded?: boolean;
  stringCount: number;
}) {
  const [startFret, endFret] = fretRange;
  const [stringIndex, fretNumber] = parseFocusedKey(currentKey) ?? [
    0,
    startFret,
  ];
  const boundedStringIndex = Math.min(
    Math.max(0, stringCount - 1),
    Math.max(0, stringIndex),
  );
  const boundedFretNumber = Math.min(endFret, Math.max(startFret, fretNumber));
  let nextString = boundedStringIndex;
  let nextFret = boundedFretNumber;

  if (direction === "up") {
    nextString = Math.max(0, boundedStringIndex - 1);
  } else if (direction === "down") {
    nextString = Math.min(Math.max(0, stringCount - 1), boundedStringIndex + 1);
  } else {
    const moveDirection =
      (direction === "left" ? -1 : 1) * (leftHanded ? -1 : 1);
    nextFret = Math.min(
      endFret,
      Math.max(startFret, boundedFretNumber + moveDirection),
    );
  }

  return `${nextString}-${nextFret}`;
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
  const numFrets = fretRange[1] - startFret + 1;
  const initialFocusedKey = `0-${startFret}`;

  const getMidiForKey = (key: string) => {
    const [stringIndex, fret] = parseFocusedKey(key) ?? [0, startFret];
    return (tuning[stringIndex] ?? tuning[0] ?? 0) + fret;
  };

  const onNavigate = (
    currentKey: string,
    direction: InstrumentNavigationDirection,
  ) =>
    getNextFretboardKey({
      currentKey,
      direction,
      fretRange,
      leftHanded,
      stringCount: tuning.length,
    });

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
