/**
 * Calculates the CSS `grid-template-columns` property for the fretboard.
 *
 * @param numFrets The total number of frets to display.
 * @param evenFrets Whether the frets should have even spacing.
 * @returns A CSS string for `grid-template-columns`.
 */
export function calculateFretboardGridColumns(
  numFrets: number,
  evenFrets: boolean | undefined,
): string {
  if (evenFrets) {
    return `repeat(${numFrets}, 1fr)`;
  }

  // For realistic fret spacing, frets get narrower as you go up the neck.
  // The width of the i-th fret (0-indexed) is proportional to 2^(-i/12).
  const fretFractions = Array.from(
    { length: numFrets },
    (_, i) => `${Math.pow(2, -i / 12).toFixed(4)}fr`,
  );
  return fretFractions.join(" ");
}
