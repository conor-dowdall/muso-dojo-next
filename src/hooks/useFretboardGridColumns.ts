import type { FretboardConfig } from "@/types/fretboard";

/**
 * Custom hook to calculate the CSS `grid-template-columns` property
 * for the fretboard, based on configuration.
 *
 * @param config The FretboardConfig object.
 * @returns A CSS string for `grid-template-columns`.
 */
export function useFretboardGridColumns(config: FretboardConfig): string {
  const [startFret, endFret] = config.fretRange;
  // Calculate the number of frets to display (inclusive range)
  const numFrets = endFret - startFret + 1;

  if (config.evenFrets) {
    return `repeat(${numFrets}, 1fr)`;
  }

  // For realistic fret spacing, frets get narrower as you go up the neck.
  // The width of the i-th fret (0-indexed) is proportional to 2^(-i/12).
  const fretFractions = Array.from(
    { length: numFrets },
    (_, i) => `${Math.pow(2, -i / 12)}fr`,
  );
  return fretFractions.join(" ");
}
