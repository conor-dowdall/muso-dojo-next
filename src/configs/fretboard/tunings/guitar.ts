/**
 * stored high-string to low-string
 * commented with low-string to high-string (human readable)
 */
export const guitarTunings = {
  "Standard E": [64, 59, 55, 50, 45, 40], // EADGBE
  DADGAD: [62, 57, 55, 50, 45, 38], // DADGAD
  "Drop D": [64, 59, 55, 50, 45, 38], // DADGBE
  "Double Drop D": [62, 59, 55, 50, 45, 38], // DADGBD
  "Half Step Down": [63, 58, 54, 49, 44, 39], // EbAbDbGbBbEb
  "Whole Step Down": [62, 57, 53, 48, 43, 38], // DGCFAD
  "Open G": [62, 59, 55, 50, 43, 38], // DGDGBD
  "Open G minor": [62, 58, 55, 50, 43, 38], // DGDGBbD
  "Open D": [62, 57, 54, 50, 45, 38], // DADF#AD
  "Open D minor": [62, 57, 53, 50, 45, 38], // DADFAD
} as const;

export type GuitarTuningName = keyof typeof guitarTunings;
