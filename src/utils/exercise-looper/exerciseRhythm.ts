import { type ExerciseSubdivision } from "@/types/session";

export type ExerciseNoteValue = "quarter" | "eighth" | "sixteenth";
export type ExerciseRhythmicFeel = "straight" | "triplet";

export interface ExerciseRhythmSelection {
  feel: ExerciseRhythmicFeel;
  noteValue: ExerciseNoteValue;
}

const subdivisionLabels = {
  quarter: "Quarter Notes",
  eighth: "Eighth Notes",
  "eighth-triplet": "Eighth-Note Triplets",
  sixteenth: "Sixteenth Notes",
  "sixteenth-triplet": "Sixteenth-Note Triplets",
} as const satisfies Record<ExerciseSubdivision, string>;

export function getExerciseRhythmSelection(
  subdivision: ExerciseSubdivision,
): ExerciseRhythmSelection {
  switch (subdivision) {
    case "quarter":
      return { feel: "straight", noteValue: "quarter" };
    case "eighth":
      return { feel: "straight", noteValue: "eighth" };
    case "eighth-triplet":
      return { feel: "triplet", noteValue: "eighth" };
    case "sixteenth":
      return { feel: "straight", noteValue: "sixteenth" };
    case "sixteenth-triplet":
      return { feel: "triplet", noteValue: "sixteenth" };
  }
}

export function getExerciseSubdivisionForRhythm({
  feel,
  noteValue,
}: ExerciseRhythmSelection): ExerciseSubdivision {
  if (noteValue === "quarter") {
    return "quarter";
  }

  return feel === "triplet" ? `${noteValue}-triplet` : noteValue;
}

export function getExerciseSubdivisionLabel(subdivision: ExerciseSubdivision) {
  return subdivisionLabels[subdivision];
}
