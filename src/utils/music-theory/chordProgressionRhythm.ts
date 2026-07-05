import {
  getAppChordProgression,
  type AppChordProgressionKey,
} from "@/utils/music-theory/appChordProgressions";
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

function getProgressionTotalBars(progression: RhythmAwareChordProgression) {
  return progression.chords.reduce(
    (total, chord) => total + chord.durationInBars,
    0,
  );
}

function getProgressionSearchTerms(
  progression: RhythmAwareChordProgression,
  totalBars: number,
) {
  return [
    progression.category,
    progression.commonName,
    progression.family,
    progression.primaryName,
    progression.style,
    ...(progression.tags ?? []),
    Number.isInteger(totalBars) ? `${totalBars}-bar` : undefined,
  ]
    .filter((term): term is string => Boolean(term))
    .map((term) => term.toLocaleLowerCase());
}

function progressionPrefersSwing(
  progression: RhythmAwareChordProgression,
  totalBars: number,
) {
  const terms = getProgressionSearchTerms(progression, totalBars);

  return (
    Math.abs(totalBars - 12) <= DURATION_EPSILON ||
    terms.some(
      (term) =>
        term.includes("blues") ||
        term.includes("jazz") ||
        term.includes("swing"),
    )
  );
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
  progressionKey: AppChordProgressionKey,
): ChordProgressionRhythmProfile {
  const progression = getAppChordProgression(
    progressionKey,
  ) as RhythmAwareChordProgression;
  const totalBars = getProgressionTotalBars(progression);
  const requiredBarDivision = getRequiredBarDivisionForDurations(
    progression.chords.map((chord) => chord.durationInBars),
  );

  return {
    hasSplitBars: requiredBarDivision > 1,
    preferredRhythmStarterId: progressionPrefersSwing(progression, totalBars)
      ? "swing"
      : "4-4",
    requiredBarDivision,
    totalBars,
  };
}
