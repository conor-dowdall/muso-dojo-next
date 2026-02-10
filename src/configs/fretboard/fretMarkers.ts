export const fretMarkers = {
  "Guitar Style": [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
  "Mandolin Style": [3, 5, 7, 10, 12, 15, 17, 19, 22, 24],
} as const;

export type FretMarkerStyle = keyof typeof fretMarkers;
