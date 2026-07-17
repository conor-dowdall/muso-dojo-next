import {
  noteLabelCollections,
  type ChordCollectionKey,
  type ChordProgression,
  type ChordProgressionChord,
  type ChordProgressionDegree,
} from "@musodojo/music-theory-data";
import {
  type SavedChordProgression,
  type SavedChordProgressionInput,
} from "@/types/custom-chord-progression";
import { isCustomChordProgressionChordCollectionKey } from "@/data/customChordProgressionChordQualities";
import {
  ensureUniqueIds,
  isRecord,
  normalizeString,
} from "@/utils/session/normalizationPrimitives";

export const CUSTOM_CHORD_PROGRESSION_MAX_BARS = 32;
export const CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR = 1;
export const CUSTOM_CHORD_PROGRESSION_MAX_BEATS_PER_BAR = 8;
export const CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR =
  CUSTOM_CHORD_PROGRESSION_MAX_BEATS_PER_BAR;

export const customChordProgressionFlatDegrees = noteLabelCollections
  .intervalsFlat.labels as readonly ChordProgressionDegree[];
export const customChordProgressionSharpDegrees = noteLabelCollections
  .intervalsSharp.labels as readonly ChordProgressionDegree[];

export interface CustomChordProgressionDraftChord {
  chordCollectionKey: ChordCollectionKey;
  degree: ChordProgressionDegree;
  durationInBars: number;
}

export interface CustomChordProgressionDraftBar {
  chords: CustomChordProgressionDraftChord[];
}

const DURATION_EPSILON = 0.000_001;
const customChordProgressionDegreeSet = new Set<string>([
  ...customChordProgressionFlatDegrees,
  ...customChordProgressionSharpDegrees,
]);

function valuesAreClose(left: number, right: number) {
  return Math.abs(left - right) <= DURATION_EPSILON;
}

function durationFitsBeatGrid(durationInBars: number, beats: number) {
  return valuesAreClose(
    durationInBars * beats,
    Math.round(durationInBars * beats),
  );
}

export function getCustomProgressionCompatibleBeatCounts(
  bars: readonly CustomChordProgressionDraftBar[],
) {
  return Array.from(
    {
      length:
        CUSTOM_CHORD_PROGRESSION_MAX_BEATS_PER_BAR -
        CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR +
        1,
    },
    (_, index) => CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR + index,
  ).filter((beats) =>
    bars.every((bar) =>
      bar.chords.every((chord) =>
        durationFitsBeatGrid(chord.durationInBars, beats),
      ),
    ),
  );
}

export interface CustomProgressionBarBeatSelection {
  bar: CustomChordProgressionDraftBar;
  chordIndex: number;
  inserted: boolean;
}

export function selectCustomProgressionBarBeat(
  bar: CustomChordProgressionDraftBar,
  beats: number,
  beatIndex: number,
): CustomProgressionBarBeatSelection | undefined {
  if (
    !Number.isInteger(beats) ||
    beats < CUSTOM_CHORD_PROGRESSION_MIN_BEATS_PER_BAR ||
    beats > CUSTOM_CHORD_PROGRESSION_MAX_BEATS_PER_BAR ||
    !Number.isInteger(beatIndex) ||
    beatIndex < 0 ||
    beatIndex >= beats ||
    !getCustomProgressionCompatibleBeatCounts([bar]).includes(beats)
  ) {
    return undefined;
  }

  const positionInBars = beatIndex / beats;
  let chordStartInBars = 0;

  for (let chordIndex = 0; chordIndex < bar.chords.length; chordIndex += 1) {
    const chord = bar.chords[chordIndex]!;
    const chordEndInBars = chordStartInBars + chord.durationInBars;

    if (valuesAreClose(positionInBars, chordStartInBars)) {
      return { bar, chordIndex, inserted: false };
    }

    if (
      positionInBars > chordStartInBars + DURATION_EPSILON &&
      positionInBars < chordEndInBars - DURATION_EPSILON
    ) {
      const leadingDuration = positionInBars - chordStartInBars;
      const trailingDuration = chordEndInBars - positionInBars;
      const nextBar = {
        chords: [
          ...bar.chords.slice(0, chordIndex),
          { ...chord, durationInBars: leadingDuration },
          { ...chord, durationInBars: trailingDuration },
          ...bar.chords.slice(chordIndex + 1),
        ],
      };

      return {
        bar: nextBar,
        chordIndex: chordIndex + 1,
        inserted: true,
      };
    }

    chordStartInBars = chordEndInBars;
  }

  return undefined;
}

export function removeCustomProgressionDraftChord(
  bar: CustomChordProgressionDraftBar,
  chordIndex: number,
): CustomChordProgressionDraftBar | undefined {
  if (
    bar.chords.length <= 1 ||
    !Number.isInteger(chordIndex) ||
    chordIndex < 0 ||
    chordIndex >= bar.chords.length
  ) {
    return undefined;
  }

  const removedChord = bar.chords[chordIndex]!;
  const recipientIndex = chordIndex > 0 ? chordIndex - 1 : 1;

  return {
    chords: bar.chords
      .map((chord, index) =>
        index === recipientIndex
          ? {
              ...chord,
              durationInBars:
                chord.durationInBars + removedChord.durationInBars,
            }
          : chord,
      )
      .filter((_, index) => index !== chordIndex),
  };
}

function normalizeChordCollectionKey(
  value: unknown,
): ChordCollectionKey | undefined {
  return isCustomChordProgressionChordCollectionKey(value) ? value : undefined;
}

function normalizeCustomProgressionChord(
  value: unknown,
): ChordProgressionChord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const degree =
    typeof value.degree === "string" &&
    customChordProgressionDegreeSet.has(value.degree)
      ? (value.degree as ChordProgressionDegree)
      : undefined;
  const chordCollectionKey = normalizeChordCollectionKey(
    value.chordCollectionKey,
  );
  const durationInBars = value.durationInBars;

  if (
    !degree ||
    !chordCollectionKey ||
    typeof durationInBars !== "number" ||
    !Number.isFinite(durationInBars) ||
    durationInBars <= 0
  ) {
    return undefined;
  }

  return { chordCollectionKey, degree, durationInBars };
}

function progressionHasValidBars(chords: readonly ChordProgressionChord[]) {
  let barCount = 0;
  let currentBar: ChordProgressionChord[] = [];
  let currentBarDuration = 0;

  for (const chord of chords) {
    if (chord.durationInBars > 1 + DURATION_EPSILON) {
      return false;
    }

    currentBar.push(chord);
    currentBarDuration += chord.durationInBars;

    if (currentBarDuration > 1 + DURATION_EPSILON) {
      return false;
    }

    if (valuesAreClose(currentBarDuration, 1)) {
      if (
        currentBar.length > CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR ||
        getCustomProgressionCompatibleBeatCounts([{ chords: currentBar }])
          .length === 0
      ) {
        return false;
      }

      barCount += 1;
      if (barCount > CUSTOM_CHORD_PROGRESSION_MAX_BARS) {
        return false;
      }

      currentBar = [];
      currentBarDuration = 0;
    }
  }

  return barCount > 0 && currentBar.length === 0;
}

export function createCustomProgressionFromBars(
  bars: readonly CustomChordProgressionDraftBar[],
): ChordProgression | undefined {
  if (
    bars.length < 1 ||
    bars.length > CUSTOM_CHORD_PROGRESSION_MAX_BARS ||
    bars.some(
      (bar) =>
        bar.chords.length < 1 ||
        bar.chords.length > CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR ||
        !valuesAreClose(
          bar.chords.reduce(
            (duration, chord) => duration + chord.durationInBars,
            0,
          ),
          1,
        ),
    )
  ) {
    return undefined;
  }

  return normalizeCustomChordProgression({
    chords: bars.flatMap((bar) => bar.chords.map((chord) => ({ ...chord }))),
  });
}

export function createCustomProgressionBars(
  progression: ChordProgression,
): CustomChordProgressionDraftBar[] | undefined {
  const bars: CustomChordProgressionDraftBar[] = [];
  let currentBar: Array<
    CustomChordProgressionDraftChord & { durationInBars: number }
  > = [];
  let currentBarDuration = 0;

  for (const chord of progression.chords) {
    let remainingDuration = chord.durationInBars;

    while (remainingDuration > DURATION_EPSILON) {
      const segmentDuration = Math.min(
        remainingDuration,
        1 - currentBarDuration,
      );
      currentBar.push({
        chordCollectionKey: chord.chordCollectionKey,
        degree: chord.degree,
        durationInBars: segmentDuration,
      });
      currentBarDuration += segmentDuration;
      remainingDuration -= segmentDuration;

      if (valuesAreClose(currentBarDuration, 1)) {
        if (
          currentBar.length > CUSTOM_CHORD_PROGRESSION_MAX_CHORDS_PER_BAR ||
          getCustomProgressionCompatibleBeatCounts([{ chords: currentBar }])
            .length === 0
        ) {
          return undefined;
        }

        bars.push({
          chords: currentBar.map(
            ({ chordCollectionKey, degree, durationInBars }) => ({
              chordCollectionKey,
              degree,
              durationInBars,
            }),
          ),
        });
        currentBar = [];
        currentBarDuration = 0;

        if (bars.length > CUSTOM_CHORD_PROGRESSION_MAX_BARS) {
          return undefined;
        }
      }
    }
  }

  return bars.length > 0 && currentBar.length === 0 ? bars : undefined;
}

export function normalizeCustomChordProgression(
  value: unknown,
): ChordProgression | undefined {
  if (!isRecord(value) || !Array.isArray(value.chords)) {
    return undefined;
  }

  const chords = value.chords.map(normalizeCustomProgressionChord);

  if (
    chords.some((chord) => chord === undefined) ||
    !progressionHasValidBars(chords as ChordProgressionChord[])
  ) {
    return undefined;
  }

  return { chords: chords as ChordProgressionChord[] };
}

export function normalizeCustomChordProgressionName(value: unknown) {
  return normalizeString(value);
}

export function normalizeSavedChordProgression(
  value: unknown,
): SavedChordProgression | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const id = normalizeString(value.id);
  const name = normalizeCustomChordProgressionName(value.name);
  const progression = normalizeCustomChordProgression(value.progression);

  return id && name && progression ? { id, name, progression } : undefined;
}

export function normalizeSavedChordProgressions(
  value: unknown,
): SavedChordProgression[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const progressions = ensureUniqueIds(
    value
      .map(normalizeSavedChordProgression)
      .filter(
        (progression): progression is SavedChordProgression =>
          progression !== undefined,
      ),
  );
  const usedNames = new Set<string>();
  const uniqueProgressions = progressions.filter((progression) => {
    const nameKey = normalizeChordProgressionNameForComparison(
      progression.name,
    );

    if (usedNames.has(nameKey)) {
      return false;
    }

    usedNames.add(nameKey);
    return true;
  });

  return uniqueProgressions.length > 0 ? uniqueProgressions : undefined;
}

export function normalizeSavedChordProgressionInput(
  value: SavedChordProgressionInput,
): SavedChordProgressionInput | undefined {
  const name = normalizeCustomChordProgressionName(value.name);
  const progression = normalizeCustomChordProgression(value.progression);

  return name && progression ? { name, progression } : undefined;
}

export function normalizeChordProgressionNameForComparison(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function savedChordProgressionNameIsAvailable(
  progressions: readonly SavedChordProgression[],
  name: string,
  excludedId?: string,
) {
  const nameKey = normalizeChordProgressionNameForComparison(name);

  return !progressions.some(
    (progression) =>
      progression.id !== excludedId &&
      normalizeChordProgressionNameForComparison(progression.name) === nameKey,
  );
}
