import { chordProgression, type RootNote } from "@musodojo/music-theory-data";
import {
  getAppChordProgression,
  getAppChordProgressionInput,
  type AppChordProgressionKey,
} from "@/utils/music-theory/appChordProgressions";
import { DISPLAY_VALUE_SEPARATOR } from "@/utils/valueSummary";

interface DurationAwareChordProgressionChord {
  durationInBars: number;
}

type ChordProgressionInput = Parameters<
  typeof chordProgression.getChordNames
>[1];
type AppChordProgressionInput = ChordProgressionInput | AppChordProgressionKey;

interface ChordProgressionDisplayMetadata {
  commonName?: string;
  primaryName?: string;
  chords: readonly DurationAwareChordProgressionChord[];
}

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
  progressionOrKey: AppChordProgressionInput,
): ChordProgressionDisplayMetadata | undefined {
  if (typeof progressionOrKey !== "string") {
    return progressionOrKey as ChordProgressionDisplayMetadata;
  }

  const progressionKey = progressionOrKey as AppChordProgressionKey;

  return getAppChordProgression(
    progressionKey,
  ) as ChordProgressionDisplayMetadata;
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
  progressionOrKey: AppChordProgressionInput,
): ChordProgressionDisplaySummary {
  const progression = resolveChordProgression(progressionOrKey);

  if (!progression) {
    return { chordNames: [], romanNames: [] };
  }

  const progressionInput =
    typeof progressionOrKey === "string"
      ? getAppChordProgressionInput(progressionOrKey as AppChordProgressionKey)
      : progressionOrKey;
  const chordNames = chordProgression.getChordNames(rootNote, progressionInput);
  const romanNames = chordProgression.getRomanSymbols(progressionInput);
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
  progressionKey: AppChordProgressionKey,
): ChordProgressionDisplayLabels {
  const summary = getChordProgressionDisplaySummary(rootNote, progressionKey);
  const progression = getAppChordProgression(
    progressionKey,
  ) as ChordProgressionDisplayMetadata;
  const romanLabel = summary.romanNames.join(DISPLAY_VALUE_SEPARATOR);

  return {
    chordLabel: summary.chordNames.join(DISPLAY_VALUE_SEPARATOR),
    romanLabel,
    titleLabel: progression.commonName ?? progression.primaryName ?? romanLabel,
  };
}
