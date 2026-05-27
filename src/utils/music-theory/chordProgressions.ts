import {
  chordProgressions,
  getChordProgressionChordNames,
  getRomanNumeralForScaleIndexAndChordQuality,
  type ChordQuality,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

interface ChordProgressionChord {
  romanSymbol?: string;
  degree: string;
  quality: ChordQuality;
  durationInBars: number;
}

interface ChordProgression {
  commonName?: string;
  primaryName?: string;
  chords: readonly ChordProgressionChord[];
}

export interface ChordProgressionDisplaySummary {
  chordNames: string[];
  romanNames: string[];
}

export interface ChordProgressionDisplayLabels {
  chordLabel: string;
  romanLabel: string;
  titleLabel: string;
}

interface ChordProgressionDisplayMetadata {
  commonName?: string;
  primaryName?: string;
}

const BAR_LENGTH = 1;
const DURATION_EPSILON = 0.000_001;

function resolveChordProgression(
  progressionOrKey: ChordProgression | ChordProgressionKey,
) {
  if (typeof progressionOrKey !== "string") {
    return progressionOrKey;
  }

  const progressionKey: ChordProgressionKey = progressionOrKey;

  return chordProgressions[progressionKey] as ChordProgression;
}

function getScaleIndexForDegree(degree: string) {
  const parsedDegree = Number.parseInt(degree, 10);

  return Number.isInteger(parsedDegree) && parsedDegree > 0
    ? parsedDegree - 1
    : undefined;
}

function getRomanNameForChord(chord: ChordProgressionChord) {
  if (chord.romanSymbol) {
    return chord.romanSymbol;
  }

  const scaleIndex = getScaleIndexForDegree(chord.degree);

  return scaleIndex === undefined
    ? chord.degree
    : (getRomanNumeralForScaleIndexAndChordQuality(scaleIndex, chord.quality) ??
        chord.degree);
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
  progressionOrKey: ChordProgression | ChordProgressionKey,
): ChordProgressionDisplaySummary {
  const progression = resolveChordProgression(progressionOrKey);

  if (!progression) {
    return { chordNames: [], romanNames: [] };
  }

  const chordNames = getChordProgressionChordNames(rootNote, progression);
  const romanNames = progression.chords.map(getRomanNameForChord);
  const durationsInBars = progression.chords.map(
    (chord) => chord.durationInBars,
  );

  return {
    chordNames: expandLabelsByBar(chordNames, durationsInBars),
    romanNames: expandLabelsByBar(romanNames, durationsInBars),
  };
}

export function getChordProgressionDisplayLabels(
  rootNote: RootNote,
  progressionKey: ChordProgressionKey,
): ChordProgressionDisplayLabels {
  const summary = getChordProgressionDisplaySummary(rootNote, progressionKey);
  const progression = chordProgressions[
    progressionKey
  ] as ChordProgressionDisplayMetadata;
  const romanLabel = summary.romanNames.join(DISPLAY_VALUE_SEPARATOR);

  return {
    chordLabel: summary.chordNames.join(DISPLAY_VALUE_SEPARATOR),
    romanLabel,
    titleLabel: progression.commonName ?? progression.primaryName ?? romanLabel,
  };
}
