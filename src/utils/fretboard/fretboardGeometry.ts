/**
 * Calculates the number of frets to display based on a start and end fret.
 * @param fretRange A tuple with the start and end fret numbers.
 * @returns The total number of frets.
 */
export function getNumFrets(fretRange: [number, number]): number {
  const [startFret, endFret] = fretRange;
  return endFret - startFret + 1;
}

/**
 * Calculates the CSS `grid-template-columns` property for the fretboard.
 *
 * A trailing "heel" column is always appended after the last fret. It is
 * never occupied by any fret, label, or note - it simply fills with
 * fingerboard background, giving the same visual breathing room that the
 * extra wood beyond the last fret wire provides on a real instrument.
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
    // Half a fret-width of trailing space keeps the proportion consistent.
    return `repeat(${numFrets}, 1fr) 0.33fr`;
  }

  // For realistic fret spacing, frets get narrower as you go up the neck.
  // The width of the i-th fret (0-indexed) is proportional to 2^(-i/12).
  const fretFractions = Array.from(
    { length: numFrets },
    (_, i) => `${Math.pow(2, -i / 12).toFixed(4)}fr`,
  );

  // Trailing heel column: the next value in the logarithmic sequence.
  const heelWidth = (Math.pow(2, -numFrets / 12) / 3).toFixed(4);
  fretFractions.push(`${heelWidth}fr`);

  return fretFractions.join(" ");
}
