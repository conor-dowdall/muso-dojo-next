/**
 * stored high-string to low-string
 */
export const guitarTunings = {
  "Standard E": [64, 59, 55, 50, 45, 40],
  DADGAD: [62, 57, 55, 50, 45, 38],
  "Double Drop D": [62, 59, 55, 50, 45, 38],
  "Half Step Down": [63, 58, 54, 49, 44, 39],
  "Whole Step Down": [62, 57, 53, 48, 43, 38],
  "Open G": [62, 59, 55, 50, 43, 38],
  "Open G minor": [62, 58, 55, 50, 43, 38],
  "Open D": [62, 57, 54, 50, 45, 38],
  "Open D minor": [62, 57, 53, 50, 45, 38],
} as const;

export type GuitarTuningName = keyof typeof guitarTunings;
