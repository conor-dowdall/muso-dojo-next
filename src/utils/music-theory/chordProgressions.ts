import {
  chordProgression,
  chordProgressions,
  type ChordProgression,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

export type ChordProgressionInput = ChordProgression | ChordProgressionKey;

export interface ChordProgressionDisplayLabels {
  chordLabel: string;
  romanLabel: string;
  titleLabel: string;
}

export interface ChordProgressionDisplaySummary {
  chordNames: string[];
  romanNames: string[];
}

const BAR_LENGTH = 1;
const DURATION_EPSILON = 0.000_001;

function resolveChordProgression(
  progressionOrKey: ChordProgressionInput,
): ChordProgression | undefined {
  if (typeof progressionOrKey !== "string") {
    return progressionOrKey;
  }

  return chordProgression.isValidKey(progressionOrKey)
    ? chordProgressions[progressionOrKey]
    : undefined;
}

function expandLabelsByBar(
  labels: readonly string[],
  durationsInBars: readonly number[],
) {
  const bars: string[] = [];
  let currentBarLabels: string[] = [];
  let remainingBarSpace = BAR_LENGTH;

  labels.forEach((label, index) => {
    let remainingDuration = durationsInBars[index] ?? 0;

    while (remainingDuration > DURATION_EPSILON) {
      currentBarLabels.push(label);
      const sliceDuration = Math.min(remainingDuration, remainingBarSpace);

      remainingDuration -= sliceDuration;
      remainingBarSpace -= sliceDuration;

      if (remainingBarSpace <= DURATION_EPSILON) {
        bars.push(currentBarLabels.join(" "));
        currentBarLabels = [];
        remainingBarSpace = BAR_LENGTH;
      }
    }
  });

  if (currentBarLabels.length > 0) {
    bars.push(currentBarLabels.join(" "));
  }

  return bars;
}

export function getChordProgressionDisplaySummary(
  rootNote: RootNote,
  progressionOrKey: ChordProgressionInput,
): ChordProgressionDisplaySummary {
  const progression = resolveChordProgression(progressionOrKey);

  if (!progression) {
    return { chordNames: [], romanNames: [] };
  }

  const chordNames = chordProgression
    .getChordReferencesByBar(rootNote, progressionOrKey)
    .map((barReferences) =>
      barReferences.map((reference) => reference.chordName).join(" "),
    );
  const romanNames = chordProgression.getRomanSymbols(progressionOrKey);
  const durationsInBars = progression.chords.map(
    (chord) => chord.durationInBars,
  );

  return {
    chordNames,
    romanNames: expandLabelsByBar(romanNames, durationsInBars),
  };
}

export function getChordProgressionDisplayLabels(
  rootNote: RootNote,
  progressionOrKey: ChordProgressionInput,
  title?: string,
): ChordProgressionDisplayLabels {
  const summary = getChordProgressionDisplaySummary(rootNote, progressionOrKey);
  const progression = resolveChordProgression(progressionOrKey);
  const romanLabel = summary.romanNames.join(DISPLAY_VALUE_SEPARATOR);

  return {
    chordLabel: summary.chordNames.join(DISPLAY_VALUE_SEPARATOR),
    romanLabel,
    titleLabel: title ?? progression?.commonName ?? romanLabel,
  };
}
