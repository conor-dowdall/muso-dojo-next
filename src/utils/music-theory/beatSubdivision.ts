export const beatSubdivisionIds = [
  "quarter",
  "eighth",
  "eighth-triplet",
  "sixteenth",
  "quintuplet",
  "sixteenth-triplet",
  "septuplet",
  "thirty-second",
] as const;

export type BeatSubdivisionId = (typeof beatSubdivisionIds)[number];
export type BeatSubdivisionCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface BeatSubdivisionConfig {
  controlLabel: string;
  countPerBeat: BeatSubdivisionCount;
  densityLabel: string;
  description: string;
  noteLabel: string;
  theoryLabel: string;
}

const beatSubdivisions = {
  quarter: {
    controlLabel: "Use 1 subdivision per beat",
    countPerBeat: 1,
    densityLabel: "1 per Beat",
    description: "One subdivision per beat.",
    noteLabel: "Quarter Notes",
    theoryLabel: "Quarter Notes",
  },
  eighth: {
    controlLabel: "Use 2 subdivisions per beat",
    countPerBeat: 2,
    densityLabel: "2 per Beat",
    description: "Two even subdivisions per beat.",
    noteLabel: "Eighth Notes",
    theoryLabel: "Straight Eighths",
  },
  "eighth-triplet": {
    controlLabel: "Use 3 subdivisions per beat",
    countPerBeat: 3,
    densityLabel: "3 per Beat",
    description: "Three even subdivisions per beat.",
    noteLabel: "Eighth-Note Triplets",
    theoryLabel: "Triplet Eighths",
  },
  sixteenth: {
    controlLabel: "Use 4 subdivisions per beat",
    countPerBeat: 4,
    densityLabel: "4 per Beat",
    description: "Four even subdivisions per beat.",
    noteLabel: "Sixteenth Notes",
    theoryLabel: "Straight Sixteenths",
  },
  quintuplet: {
    controlLabel: "Use 5 subdivisions per beat",
    countPerBeat: 5,
    densityLabel: "5 per Beat",
    description: "Five even subdivisions per beat.",
    noteLabel: "Quintuplets",
    theoryLabel: "Quintuplets",
  },
  "sixteenth-triplet": {
    controlLabel: "Use 6 subdivisions per beat",
    countPerBeat: 6,
    densityLabel: "6 per Beat",
    description: "Six even subdivisions per beat.",
    noteLabel: "Sixteenth-Note Triplets",
    theoryLabel: "Sixteenth-Note Triplets",
  },
  septuplet: {
    controlLabel: "Use 7 subdivisions per beat",
    countPerBeat: 7,
    densityLabel: "7 per Beat",
    description: "Seven even subdivisions per beat.",
    noteLabel: "Septuplets",
    theoryLabel: "Septuplets",
  },
  "thirty-second": {
    controlLabel: "Use 8 subdivisions per beat",
    countPerBeat: 8,
    densityLabel: "8 per Beat",
    description: "Eight even subdivisions per beat.",
    noteLabel: "Thirty-Second Notes",
    theoryLabel: "Thirty-Second Notes",
  },
} as const satisfies Record<BeatSubdivisionId, BeatSubdivisionConfig>;

export const beatSubdivisionOptions = beatSubdivisionIds.map((id) => ({
  id,
  ...beatSubdivisions[id],
}));

export function getBeatSubdivisionCount(id: BeatSubdivisionId) {
  return beatSubdivisions[id].countPerBeat;
}

export function getBeatSubdivisionControlLabel(id: BeatSubdivisionId) {
  return beatSubdivisions[id].controlLabel;
}

export function getBeatSubdivisionDensityLabel(id: BeatSubdivisionId) {
  return beatSubdivisions[id].densityLabel;
}

export function getBeatSubdivisionDescription(id: BeatSubdivisionId) {
  return beatSubdivisions[id].description;
}

export function getBeatSubdivisionNoteLabel(id: BeatSubdivisionId) {
  return beatSubdivisions[id].noteLabel;
}

export function getBeatSubdivisionStepBeats(id: BeatSubdivisionId) {
  return 1 / getBeatSubdivisionCount(id);
}

export function getBeatSubdivisionTheoryLabel(id: BeatSubdivisionId) {
  return beatSubdivisions[id].theoryLabel;
}
