import {
  chordProgressions,
  getChordProgressionChordNames,
  getChordProgressionTotalDurationInBars,
  getRomanNumeralForScaleIndexAndChordQuality,
  type ChordQuality,
  type ChordProgressionKey,
  type RootNote,
} from "@musodojo/music-theory-data";

interface ChordProgressionChord {
  degree: string;
  quality: ChordQuality;
  durationInBars: number;
}

interface ChordProgression {
  primaryName: string;
  chords: readonly ChordProgressionChord[];
}

type ChordProgressionLoopLength = 4 | 8 | 12;

export type ChordProgressionLoopGroupKey =
  | "fourBarLoops"
  | "eightBarLoops"
  | "twelveBarLoops";

export interface ChordProgressionLoopGroup {
  key: ChordProgressionLoopGroupKey;
  title: string;
  totalBars: ChordProgressionLoopLength;
  progressionKeys: readonly ChordProgressionKey[];
}

export interface ChordProgressionDisplaySummary {
  chordNames: string[];
  romanNames: string[];
}

const chordProgressionLoopGroupMetadata = [
  { key: "fourBarLoops", title: "4-Bar Loops", totalBars: 4 },
  { key: "eightBarLoops", title: "8-Bar Loops", totalBars: 8 },
  { key: "twelveBarLoops", title: "12-Bar Loops", totalBars: 12 },
] as const satisfies readonly Omit<ChordProgressionLoopGroup, "progressionKeys">[];

const chordProgressionKeys = Object.keys(
  chordProgressions,
) as ChordProgressionKey[];

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

export const chordProgressionLoopGroups =
  chordProgressionLoopGroupMetadata.map((group) => ({
    ...group,
    progressionKeys: chordProgressionKeys.filter(
      (progressionKey) =>
        getChordProgressionTotalDurationInBars(progressionKey) ===
        group.totalBars,
    ),
  })) as readonly ChordProgressionLoopGroup[];

export function getChordProgressionDisplaySummary(
  rootNote: RootNote,
  progressionOrKey: ChordProgression | ChordProgressionKey,
): ChordProgressionDisplaySummary {
  const progression = resolveChordProgression(progressionOrKey);

  if (!progression) {
    return { chordNames: [], romanNames: [] };
  }

  const chordNames = getChordProgressionChordNames(rootNote, progression);
  const romanNames = progression.chords.map((chord) => {
    const scaleIndex = getScaleIndexForDegree(chord.degree);

    return scaleIndex === undefined
      ? chord.degree
      : getRomanNumeralForScaleIndexAndChordQuality(scaleIndex, chord.quality) ??
          chord.degree;
  });
  const durationsInBars = progression.chords.map(
    (chord) => chord.durationInBars,
  );

  return {
    chordNames: expandLabelsByBar(chordNames, durationsInBars),
    romanNames: expandLabelsByBar(romanNames, durationsInBars),
  };
}
