/**
 * Calculates the number of frets to display based on a start and end fret.
 * @param fretRange A tuple with the start and end fret numbers.
 * @returns The total number of frets.
 */
export function getNumFrets(fretRange: [number, number]): number {
  const [startFret, endFret] = fretRange;
  return endFret - startFret + 1;
}
