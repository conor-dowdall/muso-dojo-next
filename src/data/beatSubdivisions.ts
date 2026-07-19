import {
  beatSubdivisionKeys,
  beatSubdivisions,
  type BeatSubdivisionKey,
} from "@musodojo/music-theory-data";

interface BeatSubdivisionCopy {
  controlLabel: string;
  densityLabel: string;
  description: string;
  noteLabel: string;
  theoryLabel: string;
}

const beatSubdivisionCopy = {
  "1-per-beat": {
    controlLabel: "Use 1 subdivision per beat",
    densityLabel: "1 per Beat",
    description: "One subdivision per beat.",
    noteLabel: "Quarter Notes",
    theoryLabel: "Quarter Notes",
  },
  "2-per-beat": {
    controlLabel: "Use 2 subdivisions per beat",
    densityLabel: "2 per Beat",
    description: "Two even subdivisions per beat.",
    noteLabel: "Eighth Notes",
    theoryLabel: "Straight Eighths",
  },
  "3-per-beat": {
    controlLabel: "Use 3 subdivisions per beat",
    densityLabel: "3 per Beat",
    description: "Three even subdivisions per beat.",
    noteLabel: "Eighth-Note Triplets",
    theoryLabel: "Triplet Eighths",
  },
  "4-per-beat": {
    controlLabel: "Use 4 subdivisions per beat",
    densityLabel: "4 per Beat",
    description: "Four even subdivisions per beat.",
    noteLabel: "Sixteenth Notes",
    theoryLabel: "Straight Sixteenths",
  },
  "5-per-beat": {
    controlLabel: "Use 5 subdivisions per beat",
    densityLabel: "5 per Beat",
    description: "Five even subdivisions per beat.",
    noteLabel: "Quintuplets",
    theoryLabel: "Quintuplets",
  },
  "6-per-beat": {
    controlLabel: "Use 6 subdivisions per beat",
    densityLabel: "6 per Beat",
    description: "Six even subdivisions per beat.",
    noteLabel: "Sixteenth-Note Triplets",
    theoryLabel: "Sixteenth-Note Triplets",
  },
  "7-per-beat": {
    controlLabel: "Use 7 subdivisions per beat",
    densityLabel: "7 per Beat",
    description: "Seven even subdivisions per beat.",
    noteLabel: "Septuplets",
    theoryLabel: "Septuplets",
  },
  "8-per-beat": {
    controlLabel: "Use 8 subdivisions per beat",
    densityLabel: "8 per Beat",
    description: "Eight even subdivisions per beat.",
    noteLabel: "Thirty-Second Notes",
    theoryLabel: "Thirty-Second Notes",
  },
} as const satisfies Record<BeatSubdivisionKey, BeatSubdivisionCopy>;

export const beatSubdivisionOptions = beatSubdivisionKeys.map((key) => ({
  ...beatSubdivisions[key],
  ...beatSubdivisionCopy[key],
}));

export function getBeatSubdivisionDensityLabel(key: BeatSubdivisionKey) {
  return beatSubdivisionCopy[key].densityLabel;
}

export function getBeatSubdivisionDescription(key: BeatSubdivisionKey) {
  return beatSubdivisionCopy[key].description;
}

export function getBeatSubdivisionNoteLabel(key: BeatSubdivisionKey) {
  return beatSubdivisionCopy[key].noteLabel;
}

export function getBeatSubdivisionTheoryLabel(key: BeatSubdivisionKey) {
  return beatSubdivisionCopy[key].theoryLabel;
}
