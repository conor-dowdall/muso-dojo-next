import {
  chordProgression,
  chordProgressions,
  type ChordProgressionKey,
} from "@musodojo/music-theory-data";
import { RHYTHM_MAX_BEATS } from "@/data/rhythmPresets";

const DURATION_EPSILON = 0.000_001;

export type ChordProgressionPreferredRhythmStarter = "4-4" | "swing";

interface RhythmAwareChordProgression {
  category?: string;
  chords: readonly { durationInBars: number }[];
  commonName?: string;
  family?: string;
  primaryName?: string;
  style?: string;
  tags?: readonly string[];
}

export interface ChordProgressionRhythmProfile {
  hasSplitBars: boolean;
  preferredRhythmStarterId: ChordProgressionPreferredRhythmStarter;
  requiredBarDivision: number;
  totalBars: number;
}

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b > 0) {
    const next = a % b;
    a = b;
    b = next;
  }

  return a || 1;
}

function lcm(left: number, right: number) {
  return (left / gcd(left, right)) * right;
}

function getSimpleFractionDenominator(
  value: number,
  maxDenominator = RHYTHM_MAX_BEATS,
) {
  for (let denominator = 1; denominator <= maxDenominator; denominator += 1) {
    const numerator = Math.round(value * denominator);

    if (
      numerator > 0 &&
      Math.abs(value - numerator / denominator) <= DURATION_EPSILON
    ) {
      return denominator / gcd(numerator, denominator);
    }
  }

  return undefined;
}

function progressionPrefersSwing(progression: RhythmAwareChordProgression) {
  return progression.category === "jazz" || progression.category === "blues";
}

export function getRequiredBarDivisionForDurations(
  durationsInBars: readonly number[],
) {
  return durationsInBars.reduce((division, durationInBars) => {
    if (
      typeof durationInBars !== "number" ||
      !Number.isFinite(durationInBars) ||
      durationInBars <= 0
    ) {
      return division;
    }

    const denominator = getSimpleFractionDenominator(durationInBars);

    return denominator === undefined ? division : lcm(division, denominator);
  }, 1);
}

export function getChordProgressionRhythmProfile(
  progressionKey: ChordProgressionKey,
): ChordProgressionRhythmProfile {
  const progression = chordProgressions[
    progressionKey
  ] as RhythmAwareChordProgression;
  const totalBars = chordProgression.getTotalDurationInBars(progressionKey);
  const requiredBarDivision = getRequiredBarDivisionForDurations(
    progression.chords.map((chord) => chord.durationInBars),
  );

  return {
    hasSplitBars: requiredBarDivision > 1,
    preferredRhythmStarterId: progressionPrefersSwing(progression)
      ? "swing"
      : "4-4",
    requiredBarDivision,
    totalBars,
  };
}
